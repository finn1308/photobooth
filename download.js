// download.js - Trang tải ảnh từ localStorage

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('downloadContainer');
  const data = localStorage.getItem('photobooth_images');
  if (!data) {
    container.innerHTML = '<p>Không tìm thấy ảnh nào. Hãy chụp ảnh ở trang chính trước!</p>';
    return;
  }
  const images = JSON.parse(data);
  if (!Array.isArray(images) || images.length === 0) {
    container.innerHTML = '<p>Không tìm thấy ảnh nào. Hãy chụp ảnh ở trang chính trước!</p>';
    return;
  }
  container.innerHTML = '<h2>Ảnh của bạn</h2>';
  images.forEach((src, i) => {
    const div = document.createElement('div');
    div.className = 'download-img-item';
    div.innerHTML = `<img src="${src}" alt="Ảnh ${i+1}"><a href="${src}" download="photo${i+1}.png">Tải ảnh ${i+1}</a>`;
    container.appendChild(div);
  });
  // Nút xóa ảnh khỏi localStorage
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Xóa toàn bộ ảnh';
  clearBtn.onclick = () => {
    localStorage.removeItem('photobooth_images');
    location.reload();
  };
  clearBtn.className = 'download-clear-btn';
  container.appendChild(clearBtn);
});
