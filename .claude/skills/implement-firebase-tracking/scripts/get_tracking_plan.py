import sys
import os
import json

sys.stdout.reconfigure(encoding='utf-8')

def get_plan(screen_name, constant_path):
    json_path = os.path.join("docs", "tracking_data.json")
    if not os.path.exists(json_path):
        print(f"Lỗi: Không tìm thấy {json_path}. Hãy chạy Bước 2 trước.")
        sys.exit(1)
        
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    screen_name_lower = screen_name.lower()
    relevant_events = []
    
    for row in data:
        for key, val in row.items():
            if val and isinstance(val, str) and screen_name_lower in val.lower():
                relevant_events.append(row)
                break
                
    print(f"--- Kịch bản tracking đề xuất cho màn hình: {screen_name} ---")
    if not relevant_events:
        print(f"Không tìm thấy kịch bản nào cho màn hình '{screen_name}' trong file JSON.")
        print("Hãy kiểm tra lại file Excel (docs/tracking_data.json) hoặc xin User tên màn hình chính xác.")
    else:
        print(f"Tìm thấy {len(relevant_events)} sự kiện (dựa theo khớp từ khóa). Dữ liệu chi tiết:")
        for idx, event in enumerate(relevant_events):
            print(f"Sự kiện {idx + 1}: {event}")
            
    print("\n--- Ghi chú tích hợp ---")
    print("1. Inject FirebaseAnalyticsLogger: `val logger: FirebaseAnalyticsLogger`")
    print("2. Sử dụng `logger.logEvent(TrackingConstant.EventName.XXX, Bundle().apply { ... })`")
    print("3. Các event _show, _view nên đặt trong hàm `init() {}`.")
    print("4. Nhớ validate: Tên event < 40 ký tự, alphanumeric + underscore.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python get_tracking_plan.py <screen_name> <path_to_TrackingConstant.kt>")
        sys.exit(1)
    get_plan(sys.argv[1], sys.argv[2])
