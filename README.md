# xinManager

<!-- Badges -->
<p >
  <a href="https://github.com/huangdihd/xinManager/releases" target="_blank">
    <img src="https://img.shields.io/github/v/release/huangdihd/xinManager?style=for-the-badge&label=Release&color=brightgreen" alt="Latest Release">
  </a>
  <a href="https://github.com/huangdihd/xinManager/issues" target="_blank">
    <img src="https://img.shields.io/github/issues/huangdihd/xinManager?style=for-the-badge&label=Issues&color=yellow" alt="Issues">
  </a>
  <a href="https://github.com/huangdihd/xinManager/blob/master/LICENSE" target="_blank">
    <img src="https://img.shields.io/github/license/huangdihd/xinManager?style=for-the-badge&label=License&color=blue" alt="License">
  </a>
  <a href="https://github.com/huangdihd/xinManager/stargazers" target="_blank">
    <img src="https://img.shields.io/github/stars/huangdihd/xinManager?style=for-the-badge&label=Stars&color=ff69b4" alt="Stars">
  </a>
</p>

---

> **xinManager** is a centralized panel for managing [xinbot](https://github.com/huangdihd/xinbot) instances.

---

## ✨ Features
- Manage multiple **xinbot** instances
- Monitor instance status in real time
- Access instance terminal remotely
- Track `2b2t.xin` server status

---

## 🚀 Quick Start

### 1. Install [xinRemote](https://github.com/huangdihd/xinRemote) plugin
Follow the xinRemote installation guide.  
After first run of a xinbot instance, you can get or modify the `host`, `port`, and `token` in `remote_config.json`.

---

### 2. Install xinManager
You can install xinManager via setup scripts.

#### Linux
```bash
sudo su -c "wget -qO- https://raw.githubusercontent.com/huangdihd/xinManager/master/scripts/setup_linux.sh | bash"
```

#### macOS
```bash
sudo su -c "wget -qO- https://raw.githubusercontent.com/huangdihd/xinManager/master/scripts/setup_darwin.sh | bash"
```

#### Windows
```cmd
curl -sSL -o setup_win.bat https://raw.githubusercontent.com/huangdihd/xinManager/master/scripts/setup_win.bat && more < setup_win.bat > setup_win_crlf.bat && del setup_win.bat && call setup_win_crlf.bat && del setup_win_crlf.bat
```

👉 The setup script will install xinManager as a **service**.  
You can view or modify the password in `config.json`.

---

### 3. Open xinManager in browser
Visit:
```
http://<your_server_ip>:3000
```

---

### 4. Add xinbot instances
1. Open the **Bot管理** page
2. Click **添加实例**
3. Enter the instance `address` and `token`
4. Click **添加** to finish

🎉 The instance will now appear in your list!

---
## 📜 License
This project is licensed under the terms of the  
[GNU General Public License v3.0 (GPLv3)](https://github.com/huangdihd/xinManager/blob/master/LICENSE).
