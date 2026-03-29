
import pandas as pd
import numpy as np
import random

np.random.seed(42)

NUM_USERS = 1000


def generate_college_student_data(n=NUM_USERS):
    users = []

    for i in range(n):


        student_type = random.choices(
            ['working_family_support',    # job + family help (most common)
             'working_no_family',         # self-supporting
             'family_support_only',       # no job, family covers expenses
             'financial_aid_mainly'],     # low income, relies on aid
            weights=[0.35, 0.25, 0.20, 0.20],
            k=1
        )[0]


        if student_type == 'working_family_support':
            job_income = np.random.uniform(400, 900)
            family_support = np.random.uniform(600, 1800)
            aid_income = np.random.uniform(0, 400)
            monthly_income = round(job_income + family_support + aid_income, 2)

        elif student_type == 'working_no_family':
            job_income = np.random.uniform(600, 1500)
            aid_income = np.random.uniform(200, 700)
            monthly_income = round(job_income + aid_income, 2)

        elif student_type == 'family_support_only':
            family_support = np.random.uniform(1200, 3000)
            aid_income = np.random.uniform(0, 500)
            monthly_income = round(family_support + aid_income, 2)

        else:  # financial_aid_mainly
            job_income = np.random.uniform(0, 500)
            family_support = np.random.uniform(0, 300)
            aid_income = np.random.uniform(400, 800)
            monthly_income = round(job_income + family_support + aid_income, 2)


        rent = np.random.normal(900, 250)       
        rent = max(550, min(2000, rent))        

        utilities = np.random.uniform(40, 130)
        phone = np.random.uniform(25, 65)        
        subscriptions = np.random.uniform(10, 45)
        insurance = np.random.uniform(0, 80)     

        fixed_expenses = round(rent + utilities + phone + subscriptions + insurance, 2)

        food = np.random.normal(500, 150)
        food = max(200, min(900, food))

        transportation = np.random.uniform(20, 150)
        entertainment = np.random.uniform(20, 180)
        shopping_personal = np.random.uniform(15, 120)

        variable_expenses = round(food + transportation + entertainment + shopping_personal, 2)

        total_expenses = round(fixed_expenses + variable_expenses, 2)

        savings_rate = round((monthly_income - total_expenses) / monthly_income, 4) \
            if monthly_income > 0 else -1.0

        has_credit_debt = random.random() < 0.65
        has_car_payment = random.random() < 0.20

        monthly_debt = 0
        if has_credit_debt:
            monthly_debt += np.random.uniform(30, 150)
        if has_car_payment:
            monthly_debt += np.random.uniform(150, 400)

       
        if random.random() < 0.08:
            monthly_debt += np.random.uniform(300, 700)

        debt_to_income = round(monthly_debt / monthly_income, 4) if monthly_income > 0 else 0


        if student_type == 'financial_aid_mainly':
            emergency_fund_months = max(0, round(np.random.exponential(0.5), 1))
        elif student_type == 'working_no_family':
            emergency_fund_months = max(0, round(np.random.normal(1.0, 0.8), 1))
        elif student_type == 'working_family_support':
            emergency_fund_months = max(0, round(np.random.normal(1.5, 1.0), 1))
        else:  
            emergency_fund_months = max(0, round(np.random.normal(2.0, 1.5), 1))

        emergency_fund = round(emergency_fund_months * total_expenses, 2)

        spending_volatility = round(np.random.beta(2, 3) * 0.8, 4)

        # Budget category 
        # Base: 50/30/20 rule (Ref [10])
        # Adjusted for: high debt (DTI > 0.5), low savings (< 15%), low emergency fund
        if debt_to_income > 0.5:
            budget_category = 'high_debt'       # 50/15/35
            rec_needs, rec_wants, rec_savings = 0.50, 0.15, 0.35
        elif savings_rate < 0.15:
            budget_category = 'low_savings'     # 50/35/15
            rec_needs, rec_wants, rec_savings = 0.50, 0.35, 0.15
        elif emergency_fund_months < 1:
            budget_category = 'low_emergency'   # 50/25/25
            rec_needs, rec_wants, rec_savings = 0.50, 0.25, 0.25
        else:
            budget_category = 'standard'        # 50/30/20
            rec_needs, rec_wants, rec_savings = 0.50, 0.30, 0.20

        users.append({
            'user_id': f'user_{i+1:04d}',
            'student_type': student_type,
            'monthly_income': round(monthly_income, 2),
            'fixed_expenses': fixed_expenses,
            'variable_expenses': variable_expenses,
            'total_expenses': total_expenses,
            'savings_rate': savings_rate,
            'debt_to_income': debt_to_income,
            'emergency_fund': emergency_fund,
            'emergency_fund_months': emergency_fund_months,
            'spending_volatility': spending_volatility,
            'budget_category': budget_category,
            'recommended_needs_pct': rec_needs,
            'recommended_wants_pct': rec_wants,
            'recommended_savings_pct': rec_savings,
            'recommended_needs': round(monthly_income * rec_needs, 2),
            'recommended_wants': round(monthly_income * rec_wants, 2),
            'recommended_savings': round(monthly_income * rec_savings, 2),
        })

    return pd.DataFrame(users)



df = generate_college_student_data()
df.to_csv('synthetic_student_budget_data.csv', index=False)

# --- Summary ---
print(f"Generated {len(df)} synthetic college student profiles\n")
print(f"Income:   mean=${df['monthly_income'].mean():,.0f}  range=${df['monthly_income'].min():,.0f}-${df['monthly_income'].max():,.0f}")
print(f"Expenses: mean=${df['total_expenses'].mean():,.0f}  (fixed=${df['fixed_expenses'].mean():,.0f} + variable=${df['variable_expenses'].mean():,.0f})")
print(f"Savings rate: {df['savings_rate'].mean():.1%}  |  DTI: {df['debt_to_income'].mean():.3f}")
print(f"Overspending: {(df['total_expenses'] > df['monthly_income']).mean():.1%}")
print(f"\nBudget categories:")
print(df['budget_category'].value_counts().to_string())
