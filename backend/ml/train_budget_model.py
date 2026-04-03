"""
Model Training
Train logistic regression for budget category prediction.

Categories: standard (50/30/20), low_savings (50/35/15),
            low_emergency (50/25/25), high_debt (50/15/35)
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# Load data
df = pd.read_csv('synthetic_student_budget_data.csv')
print(f"Loaded {len(df)} profiles\n")

# Features and labels
feature_columns = [
    'monthly_income', 'fixed_expenses', 'variable_expenses',
    'savings_rate', 'debt_to_income', 'emergency_fund_months',
    'spending_volatility'
]
X = df[feature_columns]
y = df['budget_category']

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train model
model = LogisticRegression(solver='lbfgs', max_iter=1000, random_state=42)
model.fit(X_train_scaled, y_train)

# Evaluate
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
print(f"Accuracy: {accuracy:.1%}\n")
print(classification_report(y_test, y_pred, zero_division=0))



# Feature coefficients
coef_df = pd.DataFrame(model.coef_, index=model.classes_, columns=feature_columns)
print("\nTop features by class:")
for cls in model.classes_:
    top = coef_df.loc[cls].sort_values(key=abs, ascending=False).head(3)
    top_str = ", ".join(f"{f} ({v:+.3f})" for f, v in top.items())
    print(f"  {cls}: {top_str}")

# Edge case tests
edge_cases = [
    ("Broke student", [600, 500, 400, -0.50, 0.15, 0, 0.6]),
    ("Stable student", [2500, 800, 500, 0.48, 0.0, 3.0, 0.1]),
    ("High debt student", [1200, 700, 400, 0.08, 0.55, 0.5, 0.4]),
    ("Average student", [1700, 900, 700, 0.06, 0.08, 1.0, 0.3]),
    ("No emergency fund", [2000, 800, 600, 0.30, 0.05, 0.2, 0.2]),
]

print("\nEdge case predictions:")
for name, values in edge_cases:
    scaled = scaler.transform([values])
    pred = model.predict(scaled)[0]
    probs = model.predict_proba(scaled)[0]
    conf = max(probs)
    print(f"  {name}: {pred} ({conf:.0%} confidence)")

# Save model and scaler
joblib.dump(model, 'budget_model.joblib')
joblib.dump(scaler, 'budget_scaler.joblib')
print("\nSaved: budget_model.joblib, budget_scaler.joblib")