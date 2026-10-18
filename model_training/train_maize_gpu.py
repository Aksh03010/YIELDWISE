"""A100-only, validation-selected maize research training runner.

Run in Colab after copying `prepared/`: python train_maize_gpu.py --prepared ...
It refuses CPU/non-A100 execution by design. Test labels are scored only after
per-target selection by 2018 environment-mean MAE.
"""
from __future__ import annotations
import argparse, hashlib, json, random
from pathlib import Path
import numpy as np, pandas as pd
from portable_validation import validate_replay

TARGETS=["Yield_Mg_ha","Grain_Moisture","Twt_kg_m3","Silk_DAP_days","Harvest_DAP_days"]
def seed(n=20261018):
    random.seed(n); np.random.seed(n)
    import torch; torch.manual_seed(n); torch.cuda.manual_seed_all(n); torch.backends.cudnn.deterministic=True; torch.backends.cudnn.benchmark=False
def hash_file(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for x in iter(lambda:f.read(1048576),b""):h.update(x)
    return h.hexdigest()
def env_metrics(frame, pred, target):
    a=frame[["Env",target]].copy(); a["prediction"]=pred; q=a.groupby("Env",as_index=False)[[target,"prediction"]].mean().dropna()
    e=q.prediction-q[target]; mae=float(e.abs().mean()); rmse=float(np.sqrt((e**2).mean()));
    denom=((q[target]-q[target].mean())**2).sum(); r2=None if denom==0 else float(1-(e**2).sum()/denom)
    mape=None
    if target=="Yield_Mg_ha":
        z=q[q[target]>0]; mape=float((abs((z.prediction-z[target])/z[target])).mean()) if len(z) else None
    return {"MAE_in_target_units":mae,"RMSE":rmse,"R2":r2,"MAPE_positive_yield_only":mape,"site_season_counts":int(len(q))},q
def split(d,target):
    x=d[d[target].notna() & ~d.ontario_holdout].copy()
    return x[x.split=="train"],x[x.split=="validation"],x[x.split=="test"],d[d.ontario_holdout & d[target].notna()].copy()
def shrunk_site_history(train, apply, target, strength=8.0):
    """History baseline only: prior train years; unknown site falls back to mean."""
    global_mean=float(train[target].mean()); stats=train.groupby("site_id")[target].agg(["mean","count"])
    values=((stats["mean"]*stats["count"]+global_mean*strength)/(stats["count"]+strength)).to_dict()
    return apply.site_id.map(values).fillna(global_mean).to_numpy(), {"type":"shrunk_site_history","global_mean":global_mean,"strength":strength,"site_values":values}
def standardize(a,b,c,features):
    med=a[features].median(); x1=a[features].fillna(med); mean=x1.mean(); std=x1.std().replace(0,1).fillna(1)
    return ((x1-mean)/std).values.astype("float32"),((b[features].fillna(med)-mean)/std).values.astype("float32"),((c[features].fillna(med)-mean)/std).values.astype("float32"),{"median":med.to_dict(),"mean":mean.to_dict(),"std":std.to_dict()}
def dense_json(model):
    return {k:v.detach().cpu().tolist() for k,v in model.state_dict().items()}
def numpy_mlp(X, weights):
    """Portable inference for the exported dense MLP, on standardized inputs."""
    x=np.asarray(X,dtype=np.float32)
    for layer,activation in (("0",True),("3",True),("5",False)):
        x=x@np.asarray(weights[f"{layer}.weight"],dtype=np.float32).T+np.asarray(weights[f"{layer}.bias"],dtype=np.float32)
        if activation: x=np.maximum(x,0)
    return x.squeeze(-1)
def train_mlp(X,y,Xv,yv):
    import torch
    dev="cuda"; model=torch.nn.Sequential(torch.nn.Linear(X.shape[1],64),torch.nn.ReLU(),torch.nn.Dropout(.1),torch.nn.Linear(64,32),torch.nn.ReLU(),torch.nn.Linear(32,1)).to(dev)
    opt=torch.optim.AdamW(model.parameters(),lr=1e-3,weight_decay=1e-3); loss=torch.nn.L1Loss(); xt=torch.tensor(X,device=dev); yt=torch.tensor(y[:,None],device=dev); xv=torch.tensor(Xv,device=dev); yv=torch.tensor(yv[:,None],device=dev)
    best=None; bestloss=float("inf"); stale=0
    for epoch in range(300):
        model.train(); opt.zero_grad(); v=loss(model(xt),yt);v.backward();opt.step()
        model.eval()
        with torch.no_grad(): z=float(loss(model(xv),yv))
        if z<bestloss-1e-5: bestloss=z; stale=0; best={k:v.detach().cpu().clone() for k,v in model.state_dict().items()}
        else: stale+=1
        if stale>=30:break
    model.load_state_dict(best); return model,epoch+1
def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--prepared",default="prepared/maize_preissue_30dap.csv.gz");ap.add_argument("--manifest",default="prepared/manifest.json");ap.add_argument("--out",default="maize_artifacts");ap.add_argument("--allowed-gpu",choices=["A100","T4"],default="A100"); args=ap.parse_args()
    import torch
    if not torch.cuda.is_available(): raise RuntimeError("CUDA GPU is required; CPU fallback is prohibited.")
    device=torch.cuda.get_device_name(0)
    if args.allowed_gpu not in device.upper(): raise RuntimeError(f"Requested {args.allowed_gpu} GPU; found {device!r}.")
    seed(); d=pd.read_csv(args.prepared); manifest=json.loads(Path(args.manifest).read_text()); features=manifest["feature_columns"]; out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    if not features or d[(d.split=="train") & ~d.ontario_holdout][features].notna().any().eq(False).any(): raise SystemExit("Prepared schema has a train-all-missing feature.")
    scores=[]; predictions=[]; artifacts={"protocol":manifest["protocol"],"research_only":True,"gpu":device,"prepared_sha256":hash_file(args.prepared),"manifest":manifest,"targets":{}}
    for target in TARGETS:
        print(f"Maize: {target}", flush=True)
        tr,va,te,on=split(d,target)
        if not len(tr) or not len(va) or not len(te): scores.append({"target":target,"status":"unavailable","reason":"required split has no label"});continue
        X,Xv,Xt,scaler=standardize(tr,va,te,features); y=tr[target].to_numpy("float32"); yv=va[target].to_numpy("float32")
        candidates={"training_mean":np.repeat(y.mean(),len(va))}
        site_val,site_model=shrunk_site_history(tr,va,target); candidates["shrunk_site_history_if_site_identifiers_are_available"]=site_val
        from sklearn.linear_model import Ridge
        ridge=Ridge(alpha=10).fit(X,y); candidates["ridge_with_training_only_scaling"]=ridge.predict(Xv)
        ymean,ystd=float(y.mean()),float(y.std() or 1); mlp,epochs=train_mlp(X,(y-ymean)/ystd,Xv,(yv-ymean)/ystd); mlp.eval()
        with torch.no_grad(): candidates["small_regularized_neural_network_on_A100"]=(mlp(torch.tensor(Xv,device="cuda")).squeeze().cpu().numpy()*ystd+ymean)
        validation={name:env_metrics(va,p,target)[0] for name,p in candidates.items()}; chosen=min(validation,key=lambda k:validation[k]["MAE_in_target_units"])
        # Validation selection is frozen before this block. Every candidate is
        # then scored once on test to expose comparisons, never to select it.
        with torch.no_grad(): mlp_test=mlp(torch.tensor(Xt,device="cuda")).squeeze().cpu().numpy()*ystd+ymean
        history_test,history_state=shrunk_site_history(tr,te,target)
        test_candidates={"training_mean":np.repeat(y.mean(),len(te)),"shrunk_site_history_if_site_identifiers_are_available":history_test,"ridge_with_training_only_scaling":ridge.predict(Xt),"small_regularized_neural_network_on_A100":mlp_test}
        test_all={name:env_metrics(te,p,target)[0] for name,p in test_candidates.items()}
        for name,p in test_candidates.items():
            _,q=env_metrics(te,p,target); q["target"]=target;q["candidate"]=name;q["selected_by_validation"]=(name==chosen);predictions.append(q)
        if chosen=="training_mean": state={"type":"mean","constant":float(y.mean())}
        elif chosen.startswith("shrunk_site_history"): state=history_state
        elif chosen.startswith("ridge"): state={"type":"ridge","coef":ridge.coef_.tolist(),"intercept":float(ridge.intercept_)}
        else:
            inline=dense_json(mlp)
            portable=numpy_mlp(Xt,inline)*ystd+ymean
            replay_check=validate_replay(mlp_test,portable)
            torch.save(mlp.state_dict(),out/f"{target}_mlp.pt"); state={"type":"mlp","weights":f"{target}_mlp.pt","inline_dense_weights":inline,"architecture":[len(features),64,32,1],"target_mean":ymean,"target_std":ystd,"epochs":epochs,"portable_replay":replay_check}
        testscore=test_all[chosen]; ons=None
        if len(on):
            _,_,Xo,_=standardize(tr,va,on,features)
            if chosen=="training_mean": op=np.repeat(y.mean(),len(on))
            elif chosen.startswith("shrunk_site_history"): op=shrunk_site_history(tr,on,target)[0]
            elif chosen.startswith("ridge"): op=ridge.predict(Xo)
            else:
                mlp.eval()
                with torch.no_grad(): op=mlp(torch.tensor(Xo,device="cuda")).squeeze().cpu().numpy()*ystd+ymean
            ons=env_metrics(on,op,target)[0]
        scores.append({"target":target,"status":"complete","selected_by_validation":chosen,"validation":validation,"test_all_candidates_once":test_all,"selected_test_metrics":testscore,"ontario_separate":ons,"rows":{"train":len(tr),"validation":len(va),"test":len(te),"ontario":len(on)}})
        artifacts["targets"][target]={"selected_candidate":chosen,"unit":manifest["targets"][target]["unit"],"features":features,"vocabularies":{},"scaler":scaler,"model":state,"training_bounds":{f:{"min":float(tr[f].min()),"max":float(tr[f].max())} for f in features},"test_metrics":testscore,"warning":"Research artifact only; no farm validation or recommendation."}
        artifacts["targets"][target]["replay_cases"]=[{"input":{f:float(row[f]) if pd.notna(row[f]) else None for f in features},"site_id":str(row.site_id),"expected_prediction":float(pred)} for (_,row),pred in zip(te.head(5).iterrows(),test_candidates[chosen][:5])]
        print(f"  selected {chosen}; test MAE {testscore['MAE_in_target_units']:.4f} {manifest['targets'][target]['unit']}",flush=True)
    pd.DataFrame(scores).to_json(out/"candidate_scores.json",orient="records",indent=2); pd.concat(predictions,ignore_index=True).to_csv(out/"test_environment_mean_predictions.csv",index=False) if predictions else None
    (out/"maize_research_artifact.json").write_text(json.dumps(artifacts,indent=2,allow_nan=False),encoding="utf-8")
    replay_columns=list(dict.fromkeys(["Env","Year"]+features))
    d[d.split=="test"].groupby("Env").head(1)[replay_columns].head(10).to_json(out/"replay_cases.json",orient="records",indent=2)
    print(json.dumps(scores,indent=2))
if __name__=="__main__":main()
