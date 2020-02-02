airreserve-api-sample
===

NodeJSを用いてAirRESERVEのAPIを使い予約情報を取得し、GoogleCalenderに登録するサンプルプログラム

# 特徴
「予約枠」事前作成タイプのAirRESERVEカレンダーから、予約枠情報を取得します。また、その情報をGoogleCalenderに登録します

サンプルで登録される情報は、
+ 枠タイトル
+ 現在人数
+ 枠時間

です。

このサンプルでは実行した時間から2ヵ月分を取得・登録を行います。

無くなった・時間が変わった予約枠などがあれば修正されます

# 事前準備
## AirReserveアカウント情報を入力 (user.json)
user.sample.jsonを参考に、ユーザー名とパスワードの書かれたuser.jsonを作成します。

使用するファイルはuser.jsonに名前を書き換えてください。

```
{"airreserve":{"username": "hogehoge", "password": "passwd", "includeSlotName": "SomeSpecialEvent"}}
```
includeSlotNameと書かれた項目は、使わない場合そのままコピーしてください。

## Googleアカウントの準備
カレンダーの内容を書き換えるので、内容がどうなってもいいGoogleアカウントを事前に作成・ログインしておきます

## Google Calendar APIの開始 (credentials.json)
[Node.js Quickstart](https://developers.google.com/calendar/quickstart/nodejs) に行って、「Enable the Google Calendar API」ボタンを押してきましょう。

適当に名前を決めたら、「DOWNLOAD CLIENT CONFIGURATION」ボタンが出るので押します。

credentials.jsonがダウンロードできるので、プロジェクトの直下に置いてください。(README.mdが置いてあるフォルダ)

# 使い方
```
npm install
npm start
```

初回はアクセストークンの発行を行うので、以下のようなURLが表示されます。

URLにアクセスして利用の許可を行い、出てきたコードを貼り付けます

```
Authorize this app by visiting this url: https://accounts.google.com/o/oauth2/v2/auth?XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX........
Enter the code from that page here:
```

