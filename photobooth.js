// photobooth.js - Xử lý photobooth: webcam, chụp, tải ảnh, ghép ảnh, hiệu ứng

const video = document.getElementById('video');
const manualBtn = document.getElementById('manualBtn');
const autoBtn = document.getElementById('autoBtn');
const retryBtn = document.getElementById('retryBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const capturedList = document.getElementById('capturedList');
const continueBtn = document.getElementById('continueBtn');
const filters = document.getElementById('filters');
const photoCountSelect = document.getElementById('photoCount'); // Element chọn số lượng ảnh
const statusElement = document.getElementById('status'); // Element hiển thị trạng thái đã chụp

// Các biến và hằng số liên quan đến popup chọn khung và sticker đã được loại bỏ
// vì chức năng này sẽ được xử lý trên trang download.html

let stream = null; // Luồng video từ webcam
let capturedImages = []; // Mảng chứa các ảnh đã chụp (dạng Data URL)
let selectedFilter = 'none'; // Filter màu đang chọn
let maxPhotos = parseInt(photoCountSelect.value); // Số lượng ảnh tối đa cần chụp, lấy từ giá trị mặc định của select

// Danh sách các khung ảnh có sẵn và sticker/chữ đã được loại bỏ
// vì chức năng này sẽ được xử lý trên trang download.html

// Hiệu ứng nhấn cho các nút
[manualBtn, autoBtn, retryBtn, uploadBtn, continueBtn].forEach(btn => {
  btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.96)');
  btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
  btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
});

// Hàm khởi động camera
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();
    document.getElementById('cameraError').style.display = 'none'; // Ẩn thông báo lỗi nếu camera hoạt động
  } catch (e) {
    // Hiển thị thông báo lỗi nếu không thể truy cập camera
    document.getElementById('cameraError').style.display = 'block';
    document.getElementById('cameraError').innerHTML =
      'Không thể truy cập camera!<br>\uD83D\uDEAB<br>\u003Cul style="text-align:left;font-size:14px;line-height:1.5;max-width:220px;margin:8px auto 0 auto;"\u003E' +
      '<li>Kiểm tra quyền truy cập camera trên trình duyệt.</li>' +
      '<li>Nên chạy trang web qua localhost hoặc server, không mở file trực tiếp.</li>' +
      '<li>Đảm bảo không có ứng dụng khác đang sử dụng camera.</li>' +
      '<li>Nếu vẫn lỗi, hãy thử tải ảnh lên từ máy.</li>' +
      '\u003C/ul\u003E';
  }
}

startCamera(); // Gọi hàm khởi động camera khi tải trang

// Hàm chụp ảnh từ webcam
function captureFromWebcam() {
  if (!video.srcObject) return; // Không chụp nếu không có luồng video
  
  // Lấy kích thước gốc của video
  const rawW = video.videoWidth;
  const rawH = video.videoHeight;
  // Kích thước mục tiêu cho ảnh (tỷ lệ 770x565)
  const targetW = 770, targetH = 565, targetRatio = targetW / targetH;
  let sx = 0, sy = 0, sw = rawW, sh = rawH;
  const rawRatio = rawW / rawH;

  // Tính toán crop để giữ tỷ lệ 770x565
  if (rawRatio > targetRatio) {
    // Webcam rộng hơn, crop 2 bên
    sw = rawH * targetRatio;
    sx = (rawW - sw) / 2;
  } else if (rawRatio < targetRatio) {
    // Webcam cao hơn, crop trên dưới
    sh = rawW / targetRatio;
    sy = (rawH - sh) / 2;
  }

  // Tạo một canvas tạm thời để vẽ ảnh đã chụp
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  
  // Vẽ ảnh từ video lên canvas, đã crop
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);
  
  // Áp dụng filter màu đã chọn lên ảnh
  applyFilterToCanvas(ctx, targetW, targetH);
  
  // Trả về ảnh dưới dạng Data URL (base64)
  return canvas.toDataURL('image/png');
}

// Hàm áp dụng filter màu lên canvas
function applyFilterToCanvas(ctx, w, h) {
  switch(selectedFilter) {
    case 'dreamy':
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#b2f7ef'; // Màu xanh nhạt
      ctx.fillRect(0,0,w,h);
      ctx.globalAlpha = 1;
      break;
    case 'fresh':
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#7ed6df'; // Màu xanh tươi
      ctx.fillRect(0,0,w,h);
      ctx.globalAlpha = 1;
      break;
    case 'warm':
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#ffe4b5'; // Màu vàng ấm
      ctx.fillRect(0,0,w,h);
      ctx.globalAlpha = 1;
      break;
    case 'film':
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#e0e0e0'; // Màu xám nhạt (hiệu ứng film)
      ctx.fillRect(0,0,w,h);
      ctx.globalAlpha = 1;
      break;
    case 'natural':
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#eaffd0'; // Màu xanh lá nhạt tự nhiên
      ctx.fillRect(0,0,w,h);
      ctx.globalAlpha = 1;
      break;
    case 'vintage':
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#f5e6c8'; // Màu be cổ điển
      ctx.fillRect(0,0,w,h);
      ctx.globalAlpha = 1;
      break;
    case 'bw':
      ctx.globalAlpha = 1;
      ctx.filter = 'grayscale(1)'; // Chuyển sang đen trắng
      ctx.drawImage(ctx.canvas, 0, 0, w, h); // Vẽ lại ảnh đã filter
      ctx.filter = 'none'; // Reset filter
      break;
    default:
      // Không áp dụng filter nào
      break;
  }
}

// Hàm hiển thị danh sách ảnh đã chụp/tải lên
function renderCapturedList() {
  capturedList.innerHTML = ''; // Xóa danh sách cũ
  capturedImages.forEach((imgSrc, idx) => {
    const div = document.createElement('div');
    div.className = 'captured-item';
    // Thêm nút xóa cho mỗi ảnh
    div.innerHTML = `<img src="${imgSrc}" draggable="false"><button class="delete-btn" title="Xóa" data-idx="${idx}">🗑️</button>`;
    capturedList.appendChild(div);
  });
  
  // Gán sự kiện click cho nút xóa
  capturedList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = e => {
      const i = +btn.dataset.idx; // Lấy index của ảnh cần xóa
      capturedImages.splice(i, 1); // Xóa ảnh khỏi mảng
      renderCapturedList(); // Render lại danh sách
      updateRetryBtn(); // Cập nhật trạng thái nút "Chụp Lại"
      updateContinueButtonState(); // Cập nhật trạng thái nút "Tiếp tục"
      updateStatus(); // Cập nhật trạng thái "Đã Chụp X/Y"
      saveImagesToLocalStorage(); // Lưu lại vào Local Storage
    };
  });
  updateRetryBtn(); // Cập nhật trạng thái nút "Chụp Lại" ban đầu
}

// Hàm cập nhật trạng thái nút "Chụp Lại"
function updateRetryBtn() {
  if (capturedImages.length > 0) {
    retryBtn.classList.remove('disabled');
    retryBtn.disabled = false;
  } else {
    retryBtn.classList.add('disabled');
    retryBtn.disabled = true;
  }
}

// Sự kiện click nút "Chụp thủ công"
manualBtn.onclick = () => {
  if (capturedImages.length >= maxPhotos) return; // Không chụp nếu đã đủ ảnh
  const img = captureFromWebcam(); // Chụp ảnh
  if (img) {
    capturedImages.push(img); // Thêm ảnh vào mảng
    renderCapturedList(); // Render lại danh sách
    updateStatus(); // Cập nhật trạng thái
    saveImagesToLocalStorage(); // Lưu vào Local Storage
    updateContinueButtonState(); // Cập nhật trạng thái nút "Tiếp tục"
  }
};

// Sự kiện click nút "Chụp Lại"
retryBtn.onclick = () => {
  capturedImages = []; // Xóa tất cả ảnh đã chụp
  renderCapturedList(); // Render lại danh sách rỗng
  saveImagesToLocalStorage(); // Lưu lại vào Local Storage
  updateStatus(); // Cập nhật trạng thái
  updateContinueButtonState(); // Cập nhật trạng thái nút "Tiếp tục"
};

// Sự kiện click nút "AUTO"
autoBtn.onclick = async () => {
  if (capturedImages.length >= maxPhotos) return; // Không chụp nếu đã đủ ảnh
  
  let countdownVal = parseInt(document.getElementById('countdown').value) || 0; // Lấy giá trị đếm ngược
  
  // Lặp để chụp đủ số ảnh còn thiếu
  for (let i = capturedImages.length; i < maxPhotos; i++) {
    let countdown = countdownVal;
    // Đếm ngược (nếu có)
    while (countdown > 0) {
      autoBtn.innerText = countdown + 's'; // Hiển thị số giây đếm ngược trên nút
      await new Promise(r => setTimeout(r, 1000)); // Chờ 1 giây
      countdown--;
    }
    autoBtn.innerText = 'AUTO'; // Reset chữ trên nút
    
    const img = captureFromWebcam(); // Chụp ảnh
    if (img) {
      capturedImages.push(img); // Thêm ảnh vào mảng
      renderCapturedList(); // Render lại danh sách
      updateStatus(); // Cập nhật trạng thái
      saveImagesToLocalStorage(); // Lưu vào Local Storage
      updateContinueButtonState(); // Cập nhật trạng thái nút "Tiếp tục"
    }
    await new Promise(r => setTimeout(r, 400)); // Nghỉ một chút giữa các lần chụp
  }
  autoBtn.innerText = 'AUTO'; // Đảm bảo nút trở lại trạng thái ban đầu
};

// Hàm cập nhật trạng thái "Đã Chụp X/Y"
function updateStatus() {
  statusElement.textContent = `Đã Chụp ${capturedImages.length}/${maxPhotos}`;
}

// Sự kiện click nút "Tải ảnh lên"
uploadBtn.onclick = () => fileInput.click(); // Kích hoạt input file ẩn
fileInput.onchange = e => {
  // Lấy các file đã chọn, giới hạn số lượng để không vượt quá maxPhotos
  const files = Array.from(fileInput.files).slice(0, maxPhotos - capturedImages.length);
  let filesLoaded = 0; // Đếm số file đã tải xong
  
  if (files.length === 0) return; // Không làm gì nếu không có file nào được chọn

  files.forEach(file => {
    const reader = new FileReader(); // Tạo FileReader để đọc file
    reader.onload = ev => {
      capturedImages.push(ev.target.result); // Thêm ảnh Data URL vào mảng
      filesLoaded++;
      if (filesLoaded === files.length) { // Khi tất cả file đã được xử lý
        renderCapturedList(); // Render lại danh sách ảnh
        updateStatus(); // Cập nhật trạng thái
        saveImagesToLocalStorage(); // Lưu vào Local Storage
        updateContinueButtonState(); // Cập nhật trạng thái nút "Tiếp tục"
      }
    };
    reader.readAsDataURL(file); // Đọc file dưới dạng Data URL
  });
  fileInput.value = ''; // Xóa giá trị input file để có thể tải lại cùng file
};

// Element overlay để hiển thị filter trực tiếp trên webcam
let filterOverlay = document.getElementById('filterOverlay');
if (!filterOverlay) { // Tạo overlay nếu chưa có
  filterOverlay = document.createElement('div');
  filterOverlay.id = 'filterOverlay';
  filterOverlay.style.position = 'absolute';
  filterOverlay.style.top = 0;
  filterOverlay.style.left = 0;
  filterOverlay.style.width = '100%';
  filterOverlay.style.height = '100%';
  filterOverlay.style.pointerEvents = 'none'; // Không chặn sự kiện chuột
  filterOverlay.style.zIndex = 2;
  document.querySelector('.photobooth-preview').appendChild(filterOverlay);
}

// Hàm cập nhật style của overlay filter
function updateFilterOverlay() {
  // Đặt lại tất cả các style liên quan đến filter trước khi áp dụng cái mới
  filterOverlay.style.background = ''; // Xóa background
  filterOverlay.style.filter = ''; // Xóa filter
  filterOverlay.style.backdropFilter = ''; // Xóa backdrop-filter
  video.style.filter = ''; // Đảm bảo reset filter trên video element

  switch(selectedFilter) {
    case 'dreamy':
      filterOverlay.style.background = 'rgba(178,247,239,0.35)';
      break;
    case 'fresh':
      filterOverlay.style.background = 'rgba(126,214,223,0.25)';
      break;
    case 'warm':
      filterOverlay.style.background = 'rgba(255,228,181,0.18)';
      break;
    case 'film':
      filterOverlay.style.background = 'rgba(224,224,224,0.18)';
      break;
    case 'natural':
      filterOverlay.style.background = 'rgba(234,255,208,0.12)';
      break;
    case 'vintage':
      filterOverlay.style.background = 'rgba(245,230,200,0.18)';
      break;
    case 'bw':
      // Áp dụng grayscale filter trực tiếp lên video element
      video.style.filter = 'grayscale(1)';
      break;
    default:
      // 'none' case, đã reset ở trên
      break;
  }
}

// Sự kiện click chọn filter
filters.onclick = e => {
  if (e.target.closest('.filter-btn')) {
    filters.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('selected')); // Bỏ chọn tất cả
    const btn = e.target.closest('.filter-btn');
    btn.classList.add('selected'); // Chọn nút được click
    selectedFilter = btn.dataset.filter; // Cập nhật filter đang chọn
    updateFilterOverlay(); // Cập nhật overlay
  }
};

updateFilterOverlay(); // Cập nhật filter overlay khi tải trang lần đầu

// --- Logic cho nút "Tiếp tục" (chuyển hướng sang download.html) ---

// Sự kiện click nút "Tiếp tục"
continueBtn.onclick = () => {
  if (capturedImages.length < maxPhotos) {
    // Thay thế alert bằng một thông báo tùy chỉnh (có thể là một modal khác)
    // Hiện tại dùng alert tạm thời, nhưng trong ứng dụng thực tế nên dùng modal đẹp hơn
    alert('Bạn cần chụp/tải đủ ' + maxPhotos + ' ảnh để tiếp tục!');
    return;
  }
  // Lưu ảnh vào Local Storage trước khi chuyển trang
  saveImagesToLocalStorage();
  // Chuyển hướng người dùng đến trang download.html
  window.location.href = 'download.html';
};

// Hàm cập nhật trạng thái nút "Tiếp tục" (enabled/disabled)
function updateContinueButtonState() {
  if (capturedImages.length === maxPhotos) {
    continueBtn.classList.remove('disabled');
    continueBtn.disabled = false;
  } else {
    continueBtn.classList.add('disabled');
    continueBtn.disabled = true;
  }
}

// Sự kiện thay đổi số lượng ảnh cần chụp (2, 3, 4 ảnh)
photoCountSelect.onchange = () => {
  maxPhotos = parseInt(photoCountSelect.value); // Cập nhật số lượng ảnh tối đa
  // Nếu số ảnh đã chụp vượt quá số lượng mới, cắt bớt
  if (capturedImages.length > maxPhotos) {
    capturedImages = capturedImages.slice(0, maxPhotos);
  }
  renderCapturedList(); // Render lại danh sách
  updateStatus(); // Cập nhật trạng thái
  saveImagesToLocalStorage(); // Lưu vào Local Storage
  updateContinueButtonState(); // Cập nhật trạng thái nút "Tiếp tục"
};

// Hàm lưu ảnh đã chụp vào Local Storage
function saveImagesToLocalStorage() {
  localStorage.setItem('photobooth_images', JSON.stringify(capturedImages));
}

// Khi tải trang, kiểm tra và phục hồi ảnh từ Local Storage nếu có
window.addEventListener('load', () => {
  const storedImages = JSON.parse(localStorage.getItem('photobooth_images'));
  if (storedImages && storedImages.length > 0) {
    capturedImages = storedImages;
  }
  // Khôi phục giá trị maxPhotos từ Local Storage hoặc dùng mặc định
  const storedPhotoCount = localStorage.getItem('photobooth_maxPhotos');
  if (storedPhotoCount) {
    photoCountSelect.value = storedPhotoCount;
    maxPhotos = parseInt(storedPhotoCount);
  }

  renderCapturedList(); // Render danh sách ảnh ban đầu
  updateStatus(); // Cập nhật trạng thái ban đầu
  updateContinueButtonState(); // Cập nhật trạng thái nút "Tiếp tục" ban đầu
});

// Lưu lựa chọn số lượng ảnh vào Local Storage khi thay đổi
photoCountSelect.addEventListener('change', () => {
  localStorage.setItem('photobooth_maxPhotos', photoCountSelect.value);
});

// Các hàm khởi tạo ban đầu khi script được tải
renderCapturedList();
updateRetryBtn();
updateStatus();
updateContinueButtonState(); // Đảm bảo nút "Tiếp tục" có trạng thái đúng ngay từ đầu
