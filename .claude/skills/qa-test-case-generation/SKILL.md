---
name: qa-test-case-generation
description: Use when the user provides a feature scenario, requirement, or user story and asks to generate or design manual test cases.
---

# QA Test Case Generation

## Overview
This skill guides you to act as a professional QA Tester. You will analyze requirements or user stories and generate comprehensive manual test cases, ensuring high coverage across positive, negative, and edge cases. You will output the results in Vietnamese and generate an `.xlsx` file for the user.

## Core Pattern: Test Case Generation

When asked to generate test cases, ALWAYS perform these steps:

1. **Analyze Requirements**: Identify the core functionality, inputs, outputs, and constraints.
2. **Generate Test Cases**: Create a structured list of test cases including:
   - Positive cases (Happy path)
   - Negative cases (Invalid inputs, error conditions)
   - Edge/Boundary cases
3. **Format as JSON**: Structure your test cases into a JSON format matching the schema below. Save this JSON using `write_to_file`.
4. **Export to Excel**: Use the bundled Python script to convert your JSON into an `.xlsx` file.

## Test Case JSON Schema

Your generated JSON MUST follow this structure. Save it to a temporary file (e.g., `test_cases.json` in the current workspace).

```json
{
  "test_cases": [
    {
      "id": "TC_LOGIN_01",
      "type": "Positive",
      "title": "Đăng nhập thành công với tài khoản hợp lệ",
      "preconditions": "Tài khoản đã được đăng ký và kích hoạt",
      "steps": [
        "Nhập email hợp lệ: test@domain.com",
        "Nhập password hợp lệ",
        "Click nút Đăng nhập"
      ],
      "expected_result": "Đăng nhập thành công, chuyển hướng vào màn hình Dashboard."
    }
  ]
}
```

## Running the Export Script

After generating and saving the JSON file, you MUST run the bundled python script to create the Excel file. 
The script is located at: `d:\AndroidStudioProjects\Satellite2\.agents\skills\qa-test-case-generation\scripts\export_to_excel.py`

Execute the following command using your terminal tool:
```bash
python d:\AndroidStudioProjects\Satellite2\.agents\skills\qa-test-case-generation\scripts\export_to_excel.py <path_to_input_json> <path_to_output_xlsx>
```

Example:
```bash
python d:\AndroidStudioProjects\Satellite2\.agents\skills\qa-test-case-generation\scripts\export_to_excel.py test_cases.json test_cases.xlsx
```

## Rules & Constraints

- **Language**: LUÔN LUÔN trả ra kết quả thảo luận và nội dung test case bằng Tiếng Việt.
- **Coverage**: LUÔN LUÔN tạo ít nhất 1 test case Negative hoặc Edge case cho mỗi chức năng.
- **Detail**: Không viết steps quá chung chung (VD: "Nhập dữ liệu hợp lệ"), mà phải chi tiết (VD: "Nhập email đúng định dạng test@domain.com").
- **Delivery**: LUÔN LUÔN sinh ra file `.xlsx` chứa danh sách các test case và thông báo cho người dùng.
