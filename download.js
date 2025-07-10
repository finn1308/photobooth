// download.js - Trang tải ảnh từ localStorage

window.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('downloadStatus');
  const continueBtn = document.getElementById('continueBtn');
  const mainArea = document.getElementById('mainDownloadArea');
  const data = localStorage.getItem('photobooth_images');
  let images = [];
  if (data) {
    images = JSON.parse(data);
  }
  // Số ảnh tối thiểu để cho phép chọn khung (có thể chỉnh 2, 3, 4 tuỳ nhu cầu)
  const minImages = 2;
  if (!images || images.length < minImages) {
    mainArea.style.display = 'none';
    statusDiv.innerHTML = `Bạn đã chụp <b>${images.length || 0}</b> ảnh. Hãy chụp đủ ${minImages} ảnh để tiếp tục!`;
    continueBtn.style.display = 'block';
    continueBtn.onclick = () => {
      window.location.href = 'index.html';
    };
    return;
  } else {
    mainArea.style.display = '';
    statusDiv.innerHTML = `Bạn đã chụp <b>${images.length}</b> ảnh. Hãy chọn khung và tải về nhé!`;
    continueBtn.style.display = 'none';
  }
  const previewArea = document.getElementById('previewArea');
  previewArea.innerHTML = '';
  images.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Ảnh ${i+1}`;
    img.style.display = 'block';
    img.style.margin = '10px auto';
    img.style.maxWidth = '90%';
    img.style.borderRadius = '16px';
    img.style.boxShadow = '0 2px 12px #ffd6f7';
    previewArea.appendChild(img);
  });
  // Nút tải về và xóa ảnh
  document.getElementById('downloadBtn').onclick = () => {
    // TODO: ghép khung, sticker rồi tải về
    alert('Chức năng tải về sẽ được cập nhật!');
  };
  document.getElementById('clearBtn').onclick = () => {
    localStorage.removeItem('photobooth_images');
    location.reload();
  };
});
