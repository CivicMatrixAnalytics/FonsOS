from enricher import inject_metadata_to_dataframe

# Your extracted polling booth / voter table DataFrame:
df_summary = extract_booth_roll_data(...)

# Enrich directly with Supabase statutory data:
df_summary = inject_metadata_to_dataframe(df_summary, ac_number=current_ac_number)

# Save to Excel
df_summary.to_excel("Electoral_Summary.xlsx", index=False)