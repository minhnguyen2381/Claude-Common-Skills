import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

import re

def sanitize_name(name):
    if not name or not name.strip():
        return None
        
    result = re.sub(r'(?i)fragment', '', name)
    result = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', result)
    result = re.sub(r'[^a-zA-Z0-9_]', '_', result)
    result = re.sub(r'^[^a-zA-Z]+', '', result)
    result = re.sub(r'_+', '_', result)
    result = result.strip('_')
    result = result.lower()
    
    if not result or not result[0].isalpha():
        return None
        
    reserved = ["firebase_", "google_", "ga_"]
    for prefix in reserved:
        if result.startswith(prefix):
            result = "app_" + result
            break
            
    if len(result) > 40:
        result = result[:40].rstrip('_')
        
    return result if result else None

def check_names(screen_name):
    file_path = os.path.join("docs", "sanitize_screen_name.txt")
    if not os.path.exists(file_path):
        print(f"Lỗi: Không tìm thấy file {file_path}. Hãy chạy Bước 1 trước.")
        return False
        
    sanitized = sanitize_name(screen_name)
    if not sanitized:
        print(f"Lỗi: Tên màn hình '{screen_name}' không hợp lệ hoặc bị rỗng sau khi sanitize.")
        return False
        
    show_evt = f"{sanitized}_show"
    view_evt = f"{sanitized}_view"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f.readlines()]
        
    has_show = show_evt in lines
    has_view = view_evt in lines
    
    print(f"--- Kiểm tra trùng lặp cho màn hình: {screen_name} ---")
    if has_show or has_view:
        print(f"-> TỒN TẠI: '{show_evt}' hoặc '{view_evt}' đã có trong nav_main.xml.")
        print("-> KHÔNG ĐƯỢC GẮN tracking _show/_view cho màn hình này nữa (để tránh double tracking).")
        return True
    else:
        print(f"-> CHƯA TỒN TẠI: '{show_evt}' và '{view_evt}' không nằm trong nav_main.xml.")
        print("-> CÓ THỂ tiến hành gắn event cho màn hình này.")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_sanitized_names.py <screen_name>")
        sys.exit(1)
    check_names(sys.argv[1])
