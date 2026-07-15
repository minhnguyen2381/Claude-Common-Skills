import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

def check_constants(file_path, screen_name):
    if not os.path.exists(file_path):
        print(f"Lỗi: Không tìm thấy file {file_path}")
        return False
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    print(f"--- Kiểm tra TrackingConstant.kt cho màn hình: {screen_name} ---")
    
    if screen_name.lower() in content.lower():
        print(f"-> Đã tìm thấy từ khóa '{screen_name}' trong TrackingConstant.")
        print("-> Hãy kiểm tra lại file để chắc chắn EventName và ParamName đã đầy đủ.")
        return True
    else:
        print(f"-> KHÔNG tìm thấy từ khóa '{screen_name}' trong TrackingConstant.")
        print("-> BẮT BUỘC: Bạn cần tạo thêm EventName và ParamName cho màn hình này!")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python check_tracking_constant.py <path_to_TrackingConstant.kt> <screen_name>")
        sys.exit(1)
    check_constants(sys.argv[1], sys.argv[2])
