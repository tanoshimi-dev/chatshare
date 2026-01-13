
本番環境のDBデータ確認

# 1. 詳細ログで接続テスト
ssh -v -i ~/.ssh/id_ed25519_mitakik25 \
    -L 5050:localhost:5050 \
    -L 8081:localhost:8081 \
    -L 8025:localhost:8025 \
    mitakik25@your-vps-ip

Windows 11 ホストでの実行例）
ssh -v -i C:\Users\rehop\.ssh\id_ed25519_mitakik25 -L 5050:localhost:5050 -L 8081:localhost:8081 -L 8025:localhost:8025 mitakik25@162.43.49.217

## 2. Adminerでの接続情報
ブラウザで `http://localhost:5050` を開いて、以下の情報を入力:
```
System:   PostgreSQL
Server:   env参照
Username: env参照
Password: env参照
Database: env参照
