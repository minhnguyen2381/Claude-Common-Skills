import sys
import xml.etree.ElementTree as ET
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

def sanitize_name(name):
    if not name or not name.strip():
        return None
        
    # 1. Loại bỏ tất cả từ "Fragment" (case-insensitive)
    result = re.sub(r'(?i)fragment', '', name)
    
    # 2. camelCase/PascalCase -> snake_case
    result = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', result)
    
    # 3. Thay thế ký tự không hợp lệ bằng "_"
    result = re.sub(r'[^a-zA-Z0-9_]', '_', result)
    
    # 4. Loại bỏ ký tự không phải chữ cái ở đầu
    result = re.sub(r'^[^a-zA-Z]+', '', result)
    
    # 5. Gộp nhiều "_" liên tiếp thành 1
    result = re.sub(r'_+', '_', result)
    
    # 6. Loại bỏ "_" ở đầu và cuối
    result = result.strip('_')
    
    # 7. Chuyển thành lowercase
    result = result.lower()
    
    # Kiểm tra nếu rỗng hoặc ký tự đầu không phải chữ cái
    if not result or not result[0].isalpha():
        return None
        
    # 8. Xử lý reserved prefixes
    reserved = ["firebase_", "google_", "ga_"]
    for prefix in reserved:
        if result.startswith(prefix):
            result = "app_" + result
            break
            
    # 9. Cắt ngắn nếu vượt quá 40 ký tự
    if len(result) > 40:
        result = result[:40].rstrip('_')
        
    return result if result else None

def main(nav_xml_path):
    if not os.path.exists(nav_xml_path):
        print(f"Error: {nav_xml_path} does not exist.")
        sys.exit(1)
        
    try:
        with open(nav_xml_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Using regex to find android:label="xxx" since XML namespaces can be tricky
        labels = re.findall(r'android:label="([^"]+)"', content)
                
        sanitized = set()
        for label in labels:
            s_name = sanitize_name(label)
            if s_name:
                sanitized.add(s_name)
            
        os.makedirs("docs", exist_ok=True)
        out_path = os.path.join("docs", "sanitize_screen_name.txt")
        with open(out_path, "w", encoding="utf-8") as f:
            for s in sorted(list(sanitized)):
                f.write(f"{s}_show\n")
                f.write(f"{s}_view\n")
                
        print(f"Đã xuất thành công {len(sanitized)} tên màn hình (sanitized) ra {out_path}.")
    except Exception as e:
        print(f"Lỗi khi trích xuất label: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_nav_labels.py <path_to_nav_main.xml>")
        sys.exit(1)
    main(sys.argv[1])
