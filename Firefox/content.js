// Парсинг SRT файла
function parseSRT(srtContent) {
  const subtitles = [];
  const blocks = srtContent.trim().split(/\n\s*\n/);
  
  blocks.forEach(block => {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      
      if (timeMatch) {
        const startTime = parseTime(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
        const endTime = parseTime(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
        const text = lines.slice(2).join('\n');
        
        subtitles.push({ startTime, endTime, text });
      }
    }
  });
  
  return subtitles;
}

function parseTime(hours, minutes, seconds, milliseconds) {
  return parseInt(hours) * 3600 + 
         parseInt(minutes) * 60 + 
         parseInt(seconds) + 
         parseInt(milliseconds) / 1000;
}

// Создание элемента субтитров
function createSubtitleElement(id, position) {
  const container = document.createElement('div');
  container.id = id;
  container.style.cssText = `
    position: absolute;
    bottom: 80px;
    ${position}: 15%;
    z-index: 9999;
    pointer-events: none;
    text-align: center;
    width: 45%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
  `;
  
  return container;
}

// Создание отдельного элемента субтитра
function createSubtitleLine(id, isPrimary = true) {
  const subtitle = document.createElement('div');
  subtitle.id = id;
  
  if (isPrimary) {
    subtitle.style.cssText = `
      display: none;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 16px;
      font-size: 20px;
      font-family: Arial, sans-serif;
      border-radius: 4px;
      line-height: 1.4;
      max-width: 100%;
    `;
  } else {
    subtitle.style.cssText = `
      display: none;
      background: rgba(0, 0, 0, 0.6);
      color: rgba(255, 255, 255, 0.7);
      padding: 6px 12px;
      font-size: 16px;
      font-family: Arial, sans-serif;
      border-radius: 4px;
      line-height: 1.3;
      max-width: 100%;
    `;
  }
  
  return subtitle;
}

// Создание кнопки загрузки
function createLoadButton(id, title) {
  const button = document.createElement('button');
  button.className = 'ytp-button';
  button.id = id;
  button.innerHTML = `
    <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
      <path fill="#fff" d="M11,11 L25,11 L25,14 L11,14 Z M11,17 L25,17 L25,20 L11,20 Z M11,23 L20,23 L20,26 L11,26 Z"/>
    </svg>
  `;
  button.title = title;
  button.style.cssText = 'cursor: pointer;';
  
  return button;
}

// Создание скрытого input для файла
function createFileInput(id) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.srt';
  input.style.display = 'none';
  input.id = id;
  return input;
}

// Отображение субтитров с расширенным окном
function displaySubtitles(subtitles, video, container, prefix) {
  const TIME_WINDOW_BEFORE = 1; // Секунды до текущего момента
  const TIME_WINDOW_AFTER = 5;  // Секунды после текущего момента
  let displayedSubtitles = new Map(); // id элемента -> индекс субтитра
  
  const updateSubtitle = () => {
    const currentTime = video.currentTime;
    const windowStart = currentTime - TIME_WINDOW_BEFORE;
    const windowEnd = currentTime + TIME_WINDOW_AFTER;
    
    const visibleSubtitles = [];
    
    // Найти все субтитры в окне времени
    for (let i = 0; i < subtitles.length; i++) {
      const sub = subtitles[i];
      
      // Проверяем, попадает ли субтитр в окно отображения
      if ((sub.startTime >= windowStart && sub.startTime <= windowEnd) ||
          (sub.endTime >= windowStart && sub.endTime <= windowEnd) ||
          (sub.startTime <= windowStart && sub.endTime >= windowEnd)) {
        visibleSubtitles.push({ index: i, ...sub });
      }
    }
    
    // Очистить контейнер от старых элементов
    container.innerHTML = '';
    displayedSubtitles.clear();
    
    // Отобразить видимые субтитры
    visibleSubtitles.forEach((sub, displayIndex) => {
      const isCurrent = currentTime >= sub.startTime && currentTime <= sub.endTime;
      const element = createSubtitleLine(`${prefix}-subtitle-${displayIndex}`, isCurrent);
      
      element.textContent = sub.text;
      element.style.display = 'inline-block';
      
      // Дополнительное выделение для текущего субтитра
      if (isCurrent) {
        element.style.borderLeft = '4px solid #3ea6ff';
      }
      
      container.appendChild(element);
      displayedSubtitles.set(displayIndex, sub.index);
    });
  };
  
  video.addEventListener('timeupdate', updateSubtitle);
  video.addEventListener('seeked', updateSubtitle);
}

// Инициализация расширения
function init() {
  const video = document.querySelector('video');
  const rightControls = document.querySelector('.ytp-right-controls');
  
  if (!video || !rightControls || document.getElementById('custom-srt-button-translated')) {
    return;
  }
  
  // Создание элементов для переведенных субтитров (слева)
  const buttonTranslated = createLoadButton('custom-srt-button-translated', 'Load SRT (Translated)');
  const fileInputTranslated = createFileInput('srt-file-input-translated');
  const subtitleContainerTranslated = createSubtitleElement('custom-subtitle-container-translated', 'left');
  
  // Создание элементов для оригинальных субтитров (справа)
  const buttonOriginal = createLoadButton('custom-srt-button-original', 'Load SRT (Original)');
  const fileInputOriginal = createFileInput('srt-file-input-original');
  const subtitleContainerOriginal = createSubtitleElement('custom-subtitle-container-original', 'right');
  
  // Добавление кнопок на панель управления
  rightControls.insertBefore(buttonOriginal, rightControls.firstChild);
  rightControls.insertBefore(buttonTranslated, rightControls.firstChild);
  
  document.body.appendChild(fileInputTranslated);
  document.body.appendChild(fileInputOriginal);
  
  const playerContainer = document.querySelector('.html5-video-player');
  if (playerContainer) {
    playerContainer.appendChild(subtitleContainerTranslated);
    playerContainer.appendChild(subtitleContainerOriginal);
  }
  
  // Обработчик для переведенных субтитров
  buttonTranslated.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInputTranslated.click();
  });
  
  fileInputTranslated.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const srtContent = event.target.result;
        const subtitles = parseSRT(srtContent);
        
        if (subtitles.length > 0) {
          displaySubtitles(subtitles, video, subtitleContainerTranslated, 'translated');
          buttonTranslated.style.color = '#3ea6ff';
        } else {
          alert('Не удалось распарсить SRT файл');
        }
      };
      reader.readAsText(file);
    }
  });
  
  // Обработчик для оригинальных субтитров
  buttonOriginal.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInputOriginal.click();
  });
  
  fileInputOriginal.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const srtContent = event.target.result;
        const subtitles = parseSRT(srtContent);
        
        if (subtitles.length > 0) {
          displaySubtitles(subtitles, video, subtitleContainerOriginal, 'original');
          buttonOriginal.style.color = '#3ea6ff';
        } else {
          alert('Не удалось распарсить SRT файл');
        }
      };
      reader.readAsText(file);
    }
  });
}

// Запуск при загрузке и при навигации
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Наблюдатель за изменениями DOM для SPA навигации YouTube
const observer = new MutationObserver(() => {
  if (window.location.href.includes('watch')) {
    setTimeout(init, 1000);
  }
});

observer.observe(document.body, { childList: true, subtree: true });
