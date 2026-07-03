# Hướng dẫn Cấu hình Quảng cáo Kiếm tiền trong App (Chỉ mục chính)

Tài liệu này chứa các hướng dẫn tham chiếu chung cho việc test cấu hình quảng cáo trong ứng dụng (In-app ad).

## 1. Quy tắc Cấu hình Chung

- **Cờ `isOn`**: Nếu `isOn` là `false`, quảng cáo KHÔNG ĐƯỢC PHÉP request hay hiển thị. Nếu `true`, quảng cáo sẽ được hiển thị khi thỏa mãn điều kiện kích hoạt.
- Nếu đã mua IAP rồi (isPremium = true), quảng cáo KHÔNG ĐƯỢC PHÉP request hay hiển thị. Nếu `false`, quảng cáo sẽ được hiển thị khi thỏa mãn điều kiện kích hoạt.

## 2. Hướng dẫn Cụ thể cho Từng Định dạng Quảng cáo

Khi gặp các định dạng quảng cáo sau trong kịch bản/cấu hình, bạn PHẢI đọc tài liệu chi tiết tương ứng để tạo ra các testcase mặc định:

- **Quảng cáo Native (Native Ad)**: Đọc `ad_guideline_native.md`
- **Quảng cáo Toàn màn hình (Interstitial Ad)**: Đọc `ad_guideline_interstitial.md`
- **Quảng cáo Hình trong Hình (Picture-in-Picture / PiP Ad)**: Đọc `ad_guideline_pip.md`
- **Quảng cáo Thu nhỏ (Squeeze Back / SB Ad)**: Đọc `ad_guideline_sb.md`
- **Quảng cáo Có thưởng (Rewarded Ad)**: Đọc `ad_guideline_reward.md`
- **Quảng cáo Biểu ngữ (Banner Ad)**: Đọc `ad_guideline_banner.md`
- **Các định dạng khác (Open App, v.v...)**: Tuân theo logic chuẩn của ngành (hiển thị đúng vị trí, hành vi đóng bình thường).

## Checklist test case bắt buộc (Chung)

Khi phân tích cấu hình in-app ad, BẮT BUỘC thêm các testcase sau cho mọi định dạng nếu có tham số tương ứng:

1. Kiểm tra cờ `isOn` = false: Đảm bảo quảng cáo không hiển thị.
2. Kiểm tra cờ `isOn` = true: Đảm bảo quảng cáo hiển thị đúng điều kiện.
3. Kiểm tra nếu chưa mua IAP, thì có load show quảng cáo như bình thường không
4. Kiểm tra nếu đã mua IAP, thì có chặn việc load show quảng cáo không. Nếu là dạng native, banner thì đã ẩn hết View Ads đi hay chưa
5. Kiểm tra xem ad format trong cấu hình có ánh xạ đúng với format hiển thị thực tế không.

*(Lưu ý: Người dùng có thể chỉnh sửa các file tham chiếu này để bao gồm các hướng dẫn riêng của dự án hoặc công ty của họ.)*
