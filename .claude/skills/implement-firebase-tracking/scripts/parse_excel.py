import pandas as pd
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def convert_excel_to_json(excel_path, json_path):
    if os.path.exists(json_path):
        print(f"File {json_path} đã tồn tại. Bỏ qua bước tạo lại (chỉ cập nhật khi user yêu cầu).")
        return
        
    try:
        df = pd.read_excel(excel_path)
        data = df.to_dict(orient='records')
        
        os.makedirs(os.path.dirname(json_path), exist_ok=True)
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
            
        print(f"Đã chuyển đổi thành công ra {json_path}")
    except Exception as e:
        print(f"Lỗi khi đọc file Excel: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python parse_excel.py <path_to_excel_file>")
        sys.exit(1)
    
    excel_path = sys.argv[1]
    convert_excel_to_json(excel_path, "docs/tracking_data.json")
