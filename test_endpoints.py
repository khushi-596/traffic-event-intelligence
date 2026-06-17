"""Quick smoke test for all Member B endpoints."""
import urllib.request
import json

BASE = "http://127.0.0.1:8000"

def get(path):
    r = urllib.request.urlopen(f"{BASE}{path}")
    return json.loads(r.read())

print("=" * 60)
print("ENDPOINT SMOKE TEST - Astram AI Traffic Backend v1.1.0")
print("=" * 60)

# 1. Root
data = get("/")
print(f"\n[PASS] GET /  -> status={data['status']}, version={data['version']}")

# 2. Health
data = get("/health")
print(f"[PASS] GET /health  -> {data['status']}")

# 3. Events
data = get("/events?limit=3")
print(f"[PASS] GET /events  -> {len(data)} events returned")

# 4. Risk Calendar
data = get("/risk-calendar")
print(f"[PASS] GET /risk-calendar  -> {data['total_events']} events, "
      f"{len(data['corridors'])} corridors, {len(data['causes'])} causes, "
      f"{len(data['heatmap_data'])} heatmap cells")

# 5. Top-K Hit Rate
print("\n--- Top-K Hit Rate Analysis ---")
for k in [3, 5, 10, 15, 20]:
    data = get(f"/risk-calendar/top-k?k={k}")
    pct = data["top_k_hit_rate"] * 100
    print(f"  K={k:2d}  ->  hit_rate={pct:5.1f}%  hits={data['hits']}/{data['total_test_events']}")

# 6. Evaluation Summary
data = get("/evaluation")
print(f"\n[PASS] GET /evaluation")
print(f"  Priority accuracy: {data['priority_classifier'].get('accuracy', 'N/A')}")
print(f"  Duration MAE: {data['duration_regressor'].get('mean_error', 'N/A')}")
print(f"  Predictions logged: {data['post_event_learning'].get('total_predictions_logged', 'N/A')}")

# 7. Classification Metrics
data = get("/evaluation/classification")
print(f"[PASS] GET /evaluation/classification -> "
      f"accuracy={data.get('accuracy', 'N/A')}, f1={data.get('f1_score', 'N/A')}")

# 8. Regression Metrics
data = get("/evaluation/regression")
print(f"[PASS] GET /evaluation/regression -> "
      f"MAE={data.get('mae', 'N/A')}, RMSE={data.get('rmse', 'N/A')}, "
      f"within_30min={data.get('within_30min_pct', 'N/A')}%, "
      f"within_60min={data.get('within_60min_pct', 'N/A')}%")

# 9. Legacy risk calendar
data = get("/forecast/risk-calendar")
print(f"[PASS] GET /forecast/risk-calendar -> {len(data)} corridor entries")

# 10. Feedback metrics
data = get("/feedback/metrics")
print(f"[PASS] GET /feedback/metrics -> {len(data)} log entries")

print("\n" + "=" * 60)
print("ALL ENDPOINTS VERIFIED SUCCESSFULLY!")
print("=" * 60)
