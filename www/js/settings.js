import { Preferences } from '@capacitor/preferences';
import { getApiKey, setApiKey } from './api.js';

export async function checkApiKeyExists() {
  const key = await getApiKey();
  return key !== null;
}

export function showSettingsModal(onClose) {
  const modal = document.createElement('div');
  modal.id = 'settingsModal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <h2>设置 API Key</h2>
        <p class="modal-desc">请输入你的 DeepSeek API Key。获取地址：<a href="https://platform.deepseek.com/" target="_blank">platform.deepseek.com</a></p>
        <input type="password" id="apiKeyInput" placeholder="sk-..." class="modal-input">
        <div class="modal-buttons">
          <button id="cancelSettings" class="btn-secondary">取消</button>
          <button id="saveSettings" class="btn-primary">保存</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const input = modal.querySelector('#apiKeyInput');
  const cancelBtn = modal.querySelector('#cancelSettings');
  const saveBtn = modal.querySelector('#saveSettings');

  getApiKey().then(key => {
    if (key) {
      input.value = key;
    }
  });

  cancelBtn.onclick = () => {
    modal.remove();
    if (onClose) onClose(false);
  };

  saveBtn.onclick = async () => {
    const key = input.value.trim();
    if (!key) {
      alert('请输入 API Key');
      return;
    }
    await setApiKey(key);
    modal.remove();
    if (onClose) onClose(true);
  };
}

export async function initSettings() {
  const hasKey = await checkApiKeyExists();
  if (!hasKey) {
    showSettingsModal();
  }
}
