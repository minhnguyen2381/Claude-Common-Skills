---
name: ad-script-qa-testcase-generator
description: This skill parses advertising scripts (Word/Markdown) AND In-App Ad Monetization Configs (JSON). It checks against reference guidelines and generates a QA Checklist/Testcase table in Excel (.xlsx) format. Use this skill when the user wants to generate testcases for video/image ad scripts OR app ad configuration files.
---

# Ad Script & Monetization QA Testcase Generator

This skill acts as a Quality Assurance (QA) and Ad Compliance Specialist. It analyzes either advertising script content (for video production) or Ad Monetization JSON configuration (for App UI) and automatically generates a detailed Checklist/Testcase table.

**CRITICAL REQUIREMENT:** The final output and all generated test cases within the Excel file MUST be written in Vietnamese UTF-8.

## Usage Instructions

When asked to generate testcases, first determine the type of input the user has provided:

### In-App Ad Monetization Script / Config (Word/Markdown/JSON)
If the user provides a script or configuration file for displaying ads in an App (containing placements, formats like Native, Interstitial, Banner, PIP, SB...):
1. **Identify Formats**: Scan the content and identify all ad placements/formats (e.g., Native, Interstitial, PIP, SB, App Open...).
2. **Read Guidelines**: Read the reference guidelines at `references/app_ad_guidelines.md`.
3. **Generate Default Test Cases (MANDATORY & EXHAUSTIVE)**: For EACH ad placement listed in the script, you MUST generate **ALL** default test cases for that format as defined in the reference guidelines, **even if they are not explicitly mentioned in the user's script/config**. You MUST refer to the detailed documents in the `references/` folder (e.g., `ad_guideline_native.md`, `ad_guideline_interstitial.md`...) and blindly extract every single check/rule into a testcase. It is MANDATORY to use the `view_file` tool to read these documents fully before generating testcases. DO NOT SKIP THIS STEP.
4. **Generate Specific Test Cases**: In addition to the exhaustive default test cases from step 3, add any specific logic test cases based on the user's specific configuration description.

### Output Format (Excel - .xlsx)
For BOTH branches, you MUST create and execute a Python script using the `openpyxl` library to generate a `.xlsx` file. DO NOT just output text/markdown.
If `openpyxl` is not installed, the script will install it automatically.
You need to replace the `data_by_config` section in the script below with the actual analyzed data from the user's script/config file.

Requirements for the Excel file:
1. **Ad Format/Placement**: Clearly identify the format (Native, Interstitial, App Open, Banner, Reward, etc.) and place it in the corresponding column or the Sheet Header.
2. **Adhere to Default Testcases**: Must always generate default testcases for EACH ad placement corresponding to that "config name" (e.g., Interstitial must have a testcase checking the X button, full-screen display; Native must check for the 'Ad' label in UI, CTA layout, etc.).
3. **Column Structure**: Must have the following columns: `Testcase_ID`, `Config Name`, `Ad Format / Placement`, `Category`, `Test Condition`, `Expected Result`, `Status`, `Notes/Actual`.
4. **Group by Config Name**: Create separate sheets for each "Config Name" for easy management.
5. **Status Dropdown**: The Status column must have Data Validation: `"Pass,Fail,N/A,Untested"`.
6. **Vietnamese Language**: The generated testcases data MUST be written in Vietnamese UTF-8.

#### Python Script (Copy and replace the `data_by_config` data, then use the run_command tool to execute):
```python
import sys
import subprocess
import os

try:
    from openpyxl import Workbook
    from openpyxl.worksheet.datavalidation import DataValidation
    from openpyxl.styles import Font, PatternFill
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl"])
    from openpyxl import Workbook
    from openpyxl.worksheet.datavalidation import DataValidation
    from openpyxl.styles import Font, PatternFill

# FILL IN THE ANALYZED DATA HERE (IN VIETNAMESE)
# Structure: data_by_config[Sheet_Name] = [List of rows]
# Columns: ["Testcase_ID", "Config Name", "Ad Format / Placement", "Category", "Test Condition", "Expected Result", "Status", "Notes/Actual"]
data_by_config = {
    "Language1.1": [
        ["TC_NAT_001", "Language1.1", "Native Ad", "UI/Layout", "Kiểm tra màu nền và CTA", "Màu nền đúng chuẩn, nút CTA bo góc 8dp", "", ""],
        ["TC_NAT_002", "Language1.1", "Native Ad", "Compliance", "Kiểm tra icon/text Ad", "Bắt buộc có chữ 'Ad' hoặc 'Quảng cáo' rõ ràng", "", ""],
    ],
    "DefaultConfig": [
        ["TC_INT_001", "DefaultConfig", "Interstitial Ad", "Behavior", "Hiển thị quảng cáo Interstitial", "Phủ full màn hình và chặn thao tác người dùng", "", ""],
        ["TC_INT_002", "DefaultConfig", "Interstitial Ad", "Behavior", "Nút Close", "Nút X (Close) hiển thị sau N giây và bấm được", "", ""],
    ]
}

wb = Workbook()
wb.remove(wb.active) # Remove default sheet

headers = ["Testcase_ID", "Config Name", "Ad Format / Placement", "Category", "Test Condition", "Expected Result", "Status", "Notes/Actual"]
header_fill = PatternFill(start_color="D3D3D3", end_color="D3D3D3", fill_type="solid")

for sheet_name, testcases in data_by_config.items():
    ws = wb.create_sheet(title=str(sheet_name)[:31]) # Sheet name max length is 31
    ws.append(headers)
    
    # Format Header
    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.fill = header_fill
    
    # Append Data
    for row in testcases:
        ws.append(row)
        
    # Auto-fit columns
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(cell.value)
            except:
                pass
        adjusted_width = (max_length + 2)
        ws.column_dimensions[column].width = adjusted_width

    # Add Dropdown Data Validation to Status column (G is the 7th column)
    dv = DataValidation(type="list", formula1='"Pass,Fail,N/A,Untested"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"G2:G{len(testcases)+1}")

output_file = os.path.join(os.getcwd(), "QA_Testcases.xlsx")
wb.save(output_file)
print(f"Excel file created successfully at: {output_file}")
```
After executing the above script using `run_command`, please return the `.xlsx` file path to the user.
