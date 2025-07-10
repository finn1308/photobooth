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
const finalCanvas = document.getElementById('finalCanvas');
const framePicker = document.getElementById('framePicker');
const downloadBtn = document.getElementById('downloadBtn');

let stream = null;
let capturedImages = [];
let selectedFilter = 'none';
let selectedFrame = 0;
let maxPhotos = 4;

const FRAMES = [
  { name: 'Không khung', border: null, overlay: null },
  { name: 'Khung Hồng', border: '#ffb6d5', overlay: null },
  { name: 'Khung Xanh', border: '#b2f7ef', overlay: null },
  { name: 'Sticker Tim', border: null, overlay: '❤️' },
  { name: 'Sticker Ngôi Sao', border: null, overlay: '⭐' },
  { name: 'Chữ "PhotoXinhh"', border: null, overlay: 'PhotoXinhh 💕' },
];

// Hiệu ứng nút
[manualBtn, autoBtn, retryBtn].forEach(btn => {
  btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.93)');
  btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
  btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
});

// Truy cập webcam
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();
    document.getElementById('cameraError').style.display = 'none';
  } catch (e) {
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

startCamera();

// Chụp ảnh từ webcam
function captureFromWebcam() {
  if (!video.srcObject) return;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  applyFilterToCanvas(ctx, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

// Áp filter màu
function applyFilterToCanvas(ctx, w, h) {
  switch(selectedFilter) {
    case 'dreamy': ctx.globalAlpha = 0.7; ctx.fillStyle = '#ffe0f7'; ctx.fillRect(0,0,w,h); ctx.globalAlpha = 1; break;
    case 'fresh': ctx.globalAlpha = 0.3; ctx.fillStyle = '#b2f7ef'; ctx.fillRect(0,0,w,h); ctx.globalAlpha = 1; break;
    case 'warm': ctx.globalAlpha = 0.2; ctx.fillStyle = '#ffe4b5'; ctx.fillRect(0,0,w,h); ctx.globalAlpha = 1; break;
    case 'film': ctx.globalAlpha = 0.2; ctx.fillStyle = '#e0e0e0'; ctx.fillRect(0,0,w,h); ctx.globalAlpha = 1; break;
    case 'natural': ctx.globalAlpha = 0.1; ctx.fillStyle = '#eaffd0'; ctx.fillRect(0,0,w,h); ctx.globalAlpha = 1; break;
    case 'vintage': ctx.globalAlpha = 0.2; ctx.fillStyle = '#f5e6c8'; ctx.fillRect(0,0,w,h); ctx.globalAlpha = 1; break;
    case 'bw': ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'saturation'; ctx.filter = 'grayscale(1)'; break;
    default: break;
  }
}

// Hiển thị ảnh đã chụp/tải lên
function renderCapturedList() {
  capturedList.innerHTML = '';
  capturedImages.forEach((img, idx) => {
    const div = document.createElement('div');
    div.className = 'captured-item';
    div.innerHTML = `<img src="${img}" draggable="false"><button class="delete-btn" title="Xóa" data-idx="${idx}">🗑️</button>`;
    capturedList.appendChild(div);
  });
  // Xử lý xóa ảnh
  capturedList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = e => {
      const i = +btn.dataset.idx;
      capturedImages.splice(i, 1);
      renderCapturedList();
      updateRetryBtn();
    };
  });
  updateRetryBtn();
}

function updateRetryBtn() {
  if (capturedImages.length > 0) {
    retryBtn.classList.remove('disabled');
    retryBtn.disabled = false;
  } else {
    retryBtn.classList.add('disabled');
    retryBtn.disabled = true;
  }
}

// Chụp thủ công
manualBtn.onclick = () => {
  if (capturedImages.length >= maxPhotos) return;
  const img = captureFromWebcam();
  if (img) {
    capturedImages.push(img);
    renderCapturedList();
    updateStatus();
  }
};

// Chụp lại
retryBtn.onclick = () => {
  capturedImages = [];
  renderCapturedList();
};

// Chụp auto
autoBtn.onclick = async () => {
  if (capturedImages.length >= maxPhotos) return;
  let countdownVal = parseInt(document.getElementById('countdown').value) || 0;
  for (let i = capturedImages.length; i < maxPhotos; i++) {
    let countdown = countdownVal;
    while (countdown > 0) {
      autoBtn.innerText = countdown + 's';
      await new Promise(r => setTimeout(r, 1000));
      countdown--;
    }
    autoBtn.innerText = 'AUTO';
    const img = captureFromWebcam();
    if (img) {
      capturedImages.push(img);
      renderCapturedList();
      updateStatus();
    }
    await new Promise(r => setTimeout(r, 400)); // nghỉ 1 chút giữa các lần chụp
  }
  autoBtn.innerText = 'AUTO';
};

function updateStatus() {
  const status = document.getElementById('status');
  status.textContent = `Đã Chụp ${capturedImages.length}/${maxPhotos}`;
}

// Tải ảnh lên
uploadBtn.onclick = () => fileInput.click();
fileInput.onchange = e => {
  const files = Array.from(fileInput.files).slice(0, maxPhotos - capturedImages.length);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      capturedImages.push(ev.target.result);
      renderCapturedList();
    };
    reader.readAsDataURL(file);
  });
  fileInput.value = '';
};

// Chọn filter
filters.onclick = e => {
  if (e.target.closest('.filter-btn')) {
    filters.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('selected'));
    const btn = e.target.closest('.filter-btn');
    btn.classList.add('selected');
    selectedFilter = btn.dataset.filter;
  }
};

// --- Trang trí khung ảnh sau khi chụp đủ 4 ảnh ---
continueBtn.onclick = () => {
  if (capturedImages.length < maxPhotos) {
    alert('Bạn cần đủ ' + maxPhotos + ' ảnh!');
    return;
  }
  // Hiện chọn khung
  framePicker.innerHTML = FRAMES.map((f, i) => `<button class="frame-btn${i===0?' selected':''}" data-idx="${i}">${f.name}</button>`).join('');
  framePicker.style.display = 'flex';
  downloadBtn.style.display = 'none';
  selectedFrame = 0;
  framePicker.querySelectorAll('.frame-btn').forEach(btn => {
    btn.onclick = () => {
      framePicker.querySelectorAll('.frame-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedFrame = +btn.dataset.idx;
      renderFinalImage();
    };
  });
  renderFinalImage();
};

function renderFinalImage() {
  // Ghép ảnh và vẽ khung/trang trí
  const imgEls = [];
  let loaded = 0;
  capturedImages.forEach((src, i) => {
    const img = new window.Image();
    img.onload = () => {
      loaded++;
      if (loaded === maxPhotos) mergeImages();
    };
    img.src = src;
    imgEls[i] = img;
  });
  function mergeImages() {
    const w = Math.max(...imgEls.map(i => i.width));
    const h = imgEls.reduce((sum, i) => sum + i.height, 0);
    finalCanvas.width = w;
    finalCanvas.height = h;
    const ctx = finalCanvas.getContext('2d');
    let y = 0;
    imgEls.forEach(img => {
      ctx.drawImage(img, 0, y, w, img.height);
      // Vẽ border nếu có
      if (FRAMES[selectedFrame].border) {
        ctx.save();
        ctx.strokeStyle = FRAMES[selectedFrame].border;
        ctx.lineWidth = 10;
        ctx.strokeRect(5, y+5, w-10, img.height-10);
        ctx.restore();
      }
      // Vẽ overlay nếu có
      if (FRAMES[selectedFrame].overlay) {
        ctx.save();
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ff4b91';
        ctx.fillText(FRAMES[selectedFrame].overlay, w/2, y+12);
        ctx.restore();
      }
      y += img.height;
    });
    finalCanvas.style.display = 'block';
    downloadBtn.href = finalCanvas.toDataURL('image/png');
    downloadBtn.style.display = 'block';
  }
}

downloadBtn.onclick = () => {
  downloadBtn.download = 'photobooth.png';
};

// Đổi số lượng ảnh
const photoCount = document.getElementById('photoCount');
photoCount.onchange = () => {
  maxPhotos = parseInt(photoCount.value);
  capturedImages = [];
  renderCapturedList();
  updateStatus();
};

// Hiệu ứng cho uploadBtn
uploadBtn.onmousedown = () => uploadBtn.style.transform = 'scale(0.96)';
uploadBtn.onmouseup = uploadBtn.onmouseleave = () => uploadBtn.style.transform = 'scale(1)';

// Khởi tạo
renderCapturedList();
updateRetryBtn();
updateStatus();
