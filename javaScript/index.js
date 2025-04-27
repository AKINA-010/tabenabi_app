// お気に入りエリアのページネーション用変数追加
let currentFavPage = 1;
const itemsPerPage = 7;  // 1ページに最大7件のお気に入りを表示

let currentLang = 'ja';  // デフォルトは日本語
// ページネーション状態管理
let currentPage = 1;
const resultsPerPage = 3;
//分页状态管理

// APIキー設定
const API_KEY = "4df7b82467c564cb";
const PROXY = "https://cors-anywhere.herokuapp.com/";

let currentLat = null;
let currentLng = null;
let map = null;
let markers = [];

// 言語切り替え処理
function switchLanguage(lang) {
currentLang = lang;
const jaElements = document.querySelectorAll('.lang-ja');
  const enElements = document.querySelectorAll('.lang-en');

  if (lang === 'ja') {
    jaElements.forEach(el => el.style.display = '');
    enElements.forEach(el => el.style.display = 'none');
  } else {
    jaElements.forEach(el => el.style.display = 'none');
    enElements.forEach(el => el.style.display = '');
  }
  renderComparison(); // 言語切り替え後、お気に入りテーブルを再描画
  
  document.getElementById("keyword").placeholder =
  lang === 'ja' ? '例：ラーメン' : 'example: BBQ';

}
// 初期言語設定
switchLanguage('ja');   // デフォルトで日本語表示

//============== Googleマップとユーザー現在地関連      
// ユーザーの現在地（緯度・経度）を取得してGoogleマップ上に（Marker）を表示する
navigator.geolocation.getCurrentPosition(  // ブラウザ位置情報API成功時
  (pos) => {
    // currentLat = 35.681236; // 东京站
    // currentLng = 139.767125;
    currentLat = pos.coords.latitude; // 緯度
    currentLng = pos.coords.longitude; // 経度
    console.log(" 取得した緯度経度", currentLat, currentLng); 
    console.log("位置情報取得成功", pos);
    initMap();
  },
  (err) => { // 位置情報取得失敗時
    alert("位置情報の取得失敗しました：" + err.message);
    console.warn("デフォルト座標を使用");
    currentLat = 35.681236; // 東京駅
    currentLng = 139.767125;
    initMap();
  }
);

// マップ初期化処理
function initMap() {
  if (!currentLat || !currentLng || isNaN(currentLat) || isNaN(currentLng)) {
    console.error("緯度または経度が無効です！");
    return;
  }
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: currentLat, lng: currentLng },
    zoom: 15
  });
  //Marker  自分の位置を表示
  new google.maps.Marker({
    position: { lat: currentLat, lng: currentLng },
    map: map,
    label: "me",
    title: "現在位置"
  });
  showNearbyRecommendations();
}
// 重要：windowオブジェクトに公開し、Google Maps APIから呼び出せるようにする
window.initMap = initMap;
//==============  Googleマップとユーザー現在地関連 

//============== 検索機能
function search() {
  const sortType = document.getElementById("sortType").value;// ユーザー選択のソート条件を取得

  const range = document.getElementById("range").value;
  const keyword = document.getElementById("keyword").value;
  const budget = document.getElementById("budget").value;
  const genre = document.getElementById("genre").value;
  const openNow = document.getElementById("openNow").checked;
  const nonSmoking = document.getElementById("nonSmoking").checked;
 
// APIリクエスト生成 
  let realUrl = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${API_KEY}&lat=${currentLat}&lng=${currentLng}&range=${range}&format=json`;
  const start = (currentPage - 1) * resultsPerPage + 1;
  realUrl += `&start=${start}`;
console.log("APIリクエスト：", realUrl);

// ユーザー入力に基づいてURLにパラメータを付加
  if (keyword) realUrl += `&keyword=${encodeURIComponent(keyword)}`;
  if (budget) realUrl += `&budget=${budget}`;
  if (genre) realUrl += `&genre=${genre}`;
  if (openNow) realUrl += `&open_now=1`;
  if (nonSmoking) realUrl += `&non_smoking=1`;
  

  const proxyUrl = PROXY + realUrl;

// データ取得と結果表示
  fetch(proxyUrl)
    .then(res => res.json())
    .then(data => {
      const results = document.getElementById("results");
      results.innerHTML = "";
      clearMarkers();

      if (!data.results.shop || data.results.shop.length === 0) {
        results.innerHTML = `<p>${currentLang === 'ja' ? '条件に合うレストランが見つかりませんでした。':'No restaurants found that match your search criteria.'}</p>`;
        return;
      }
//===========ソート処理
let shopList = data.results.shop; // Hot Pepper APIから取得した店舗データを変数に保存
shopList.forEach(shop => {
  console.log(`店名: ${shop.name} | 電話: ${shop.tel}`);
});

// 予算文字列（例："￥3000"や"￥1000～￥2000"）から数値を取り出して比較用に変換
function extractPrice(budgetObj) {

  if (!budgetObj || !budgetObj.average) return 0;  //判断

  const match = budgetObj.average.match(/\d+/g); // 数字部分だけ抽出
  if (match) {
    return parseInt(match[0]); // 最初に見つかった数字を返す
  }
  return 0;
}

// ソートロジック
if (sortType === "distance") {
  shopList.sort((a, b) => {
    const distA = getSimpleDistance(currentLat, currentLng, a.lat, a.lng);
    const distB = getSimpleDistance(currentLat, currentLng, b.lat, b.lng);
    return distA - distB;
  });
} else if (sortType === "priceLow") {
  shopList.sort((a, b) => extractPrice(a.budget) - extractPrice(b.budget));
} else if (sortType === "priceHigh") {
  shopList.sort((a, b) => extractPrice(b.budget) - extractPrice(a.budget));
}

//============ 検索結果リスト表示（レンダリング処理） 
                              //店舗情報   
        shopList.forEach(shop => {
        // 現在の店舗の「緯度」と「経度」を取得し、後でマップにマーカーを追加するために使用
        const lat = parseFloat(shop.lat);
        const lng = parseFloat(shop.lng);

        const phone = shop.tel || "";
        // 新しいHTML要素を作成（1店舗分）
        const div = document.createElement("div");
        // この<div>にCSSスタイル用のクラス名を設定
             // 店舗の画像（Hot Pepper APIから写真リンクが返される）
             // クリックするとdetail.htmlページに遷移し、店舗IDをパラメータとして渡す
             // これはお気に入り追加ボタンで、多くのdata-*属性を持ち、後でクリック時に情報を読み取るために使用
        div.className = "shop-card";
        div.innerHTML = `
          <div class="shop-cardMain">
            <img src="${shop.photo.mobile.l}" alt="${shop.name}"> 
            <h2>${shop.name}</h2>
            ${phone ? `<a href="tel:${phone}"><button class="redBtn">${currentLang === 'ja' ? '電話する' : 'Call'}</button></a>` : ''}
          </div>  
          <p><strong>${currentLang === 'ja' ? '住所:' : '	Address:'}</strong>${shop.address}</p>
          <p><strong>${currentLang === 'ja' ? '最寄駅:' : '	Nearest station :'}</strong>${shop.access}</p>
          <p><strong>${currentLang === 'ja' ? '営業時間:' : '	Business hours:'}</strong>${shop.open}</p>
          <div class="shop-card-btn">
            <div class="shop-card-btn-a">
              <a href="detail.html?id=${shop.id}" target="_blank">
                <button class="redBtn lang-ja">お店の情報</button>
                <button class="redBtn lang-en">Shop Info</button>
              </a>
              <a href="#" class="go-map" data-lat="${shop.lat}" data-lng="${shop.lng}">
              <button class="redBtn lang-ja">ルート案内</button>
              <button class="redBtn lang-en" style="display: none;">Route</button>
              </a>
            </div> 

            <button class="add-favorite lang-ja" data-id="${shop.id}" 
              data-name="${shop.name}" 
              data-budget="${shop.budget.name}" 
              data-genre="${shop.genre.name}" 
              data-lat="${shop.lat}" 
              data-lng="${shop.lng}"
              data-address="${shop.address}" 
              data-open="${shop.open}" 
              data-access="${shop.access}" 
              data-photo="${shop.photo?.pc?.l || shop.photo?.mobile?.l || ''}" 
              data-link="${shop.urls.pc}">
              お気に入り追加
            </button>

             <button class="add-favorite lang-en" data-id="${shop.id}" 
              data-name="${shop.name}" 
              data-budget="${shop.budget.name}" 
              data-genre="${shop.genre.name}" 
              data-lat="${shop.lat}" 
              data-lng="${shop.lng}"
              data-address="${shop.address}" 
              data-open="${shop.open}" 
              data-access="${shop.access}" 
              data-photo="${shop.photo?.pc?.l || shop.photo?.mobile?.l || ''}" 
              data-link="${shop.urls.pc}">
              Add to Favorite
            </button>
          </div>  
        `;
        // 作成した店舗カードを#resultsに追加
        results.appendChild(div);

        // Googleマップにマーカー追加
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: shop.name
        });
        
        // Googleマップの情報ウィンドウ
        const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="min-width:200px">
            <strong>${shop.name}</strong><br>
            ${shop.address}<br>
            <small>${shop.open}</small><br><br>
            <div class="map-card-btn">
              <div class="map-card-btn-a">
                <a href="detail.html?id=${shop.id}" target="_blank">
  <button class="redBtn lang-ja">お店の情報</button>
  <button class="redBtn lang-en">Shop Info</button>
</a>

                <a href="#" class="go-map" data-lat="${shop.lat}" data-lng="${shop.lng}">
                  <button class="redBtn lang-ja" >ルート案内</button>
                  <button class="redBtn lang-en" >Route</button>
                </a>
              </div>
              <button class="info-add-favorite lang-ja" 
                data-id="${shop.id}"
                data-name="${shop.name}"
                data-budget="${shop.budget.name}"
                data-genre="${shop.genre.name}"
                data-lat="${shop.lat}"
                data-lng="${shop.lng}">
                お気に入り追加
              </button>

              <button class="info-add-favorite lang-en" 
                data-id="${shop.id}"
                data-name="${shop.name}"
                data-budget="${shop.budget.name}"
                data-genre="${shop.genre.name}"
                data-lat="${shop.lat}"
                data-lng="${shop.lng}">
                Add to Favorite
              </button>
            </div>  

          </div>
        `
        
      });


        marker.addListener("click", function () {
        infoWindow.open(map, marker);
        switchLanguage(currentLang);
        });
     
        markers.push(marker);
      });
      switchLanguage(currentLang); 


      // ページネーション更新
      document.getElementById("pageNumber").textContent = currentPage;


      document.getElementById("back").disabled = currentPage === 1;
      document.getElementById("backEn").disabled = currentPage === 1;

      document.getElementById("next").disabled = data.results.results_returned < resultsPerPage;
      document.getElementById("nextEn").disabled = data.results.results_returned < resultsPerPage;

    })
    .catch(error => {
      console.error("API リクエスト失敗：", error);
      alert(currentLang === 'ja' ? "API リクエストに失敗しました。APIキーを確認するか、後でもう一度お試しください。" : "API request failed. Please check your API key or try again later.");
    });
}
// 検索フォーム送信イベントを監視
document.getElementById("searchForm").addEventListener("submit", function (e) {
  e.preventDefault();// ページリロードを防止
  currentPage = 1;// ページをリセット
  search();// 検索実行
});
// ソートセレクトボックス変更時に検索を再実行
document.getElementById("sortType").addEventListener("change", function () {
  currentPage = 1;
  search(); // ソート選択が変更されたときに自動的に再読み込みする
});

// マーカーをすべて削除する関数
function clearMarkers() {
  markers.forEach(marker => marker.setMap(null));
  markers = [];
}


// 推薦キーワードボタンのクリックイベントをバインド
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("keyword-btn")) {
    const keywordInput = document.getElementById("keyword");
    keywordInput.value = e.target.innerText.trim();  // クリックしたキーワードを検索欄にセット
    currentPage = 1; // ページをリセット
  }
});
// 英語キーワードボタンをクリックしたら日本語に変換して検索欄にセット
document.querySelectorAll(".keyword-en-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const jpWord = btn.getAttribute("data-jp");
    document.getElementById("keyword").value = jpWord;
  });
});

//=== 検索結果ページネーション（次へ）
document.getElementById("next").addEventListener("click", () => {
  currentPage++;
  search();
});
document.getElementById("back").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    search();
  }
});
//=== 英語ページネーション（次へ）
document.getElementById("nextEn").addEventListener("click", () => {
  currentPage++;
  search();
});
document.getElementById("backEn").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    search();
  }
});


//=========================== お気に入り追加ボタンのクリック処理

// jQueryでお気に入り追加機能を実装、比較エリアも自動更新
// すべての .add-favorite クラスのボタンのクリックイベントを監視する
$(document).on("click", ".add-favorite", function () { // ボタンは動的に生成されるため、「イベントデリゲーション」でクリックイベントをバインドする
         // ボタンからdata-*属性を取得して店舗情報を作成
  const shopData = {
    id: $(this).data("id"),
    name: $(this).data("name"),
    budget: $(this).data("budget"),
    genre: $(this).data("genre"),
    lat: parseFloat($(this).data("lat")),
    lng: parseFloat($(this).data("lng")),
    address: $(this).data("address"),
    open: $(this).data("open"),
    access: $(this).data("access"),
    photo: $(this).data("photo") || "",
    link: $(this).data("link")
  };

  // localStorageから既存のお気に入りを取得
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  // すでに存在するかチェック（id比較）
  const exists = favorites.some(shop => shop.id === shopData.id);
  if (!exists) {
    favorites.push(shopData);
   // 更新後の配列を保存
    localStorage.setItem("favorites", JSON.stringify(favorites));
    alert(currentLang === 'ja'
      ? `${shopData.name} を『お気に入り』に追加しました！`
      : `${shopData.name} has been added to favorites!`);
    renderComparison(); // 比較エリア再描画
  } else {
    alert(currentLang === 'ja'
      ? "すでに『お気に入り』に追加されています。"
      : "This shop is already in your favorites.");
  }
});

// 比較エリア自動描画関数
function renderComparison() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const isMobile = window.innerWidth <= 768;

  // 画面サイズに応じてレンダリング対象のtbodyを選択する
  const $targetTable = isMobile ? $("#favoriteTableBodyMobile") : $("#favoriteTableBody");
  const $unusedTable = isMobile ? $("#favoriteTableBodyPC") : $("#favoriteTableBodyMobile");
  $unusedTable.empty(); // ダブル描画防止
  $targetTable.empty(); // まずクリア

  // お気に入りがない場合はメッセージを表示する
  if (favorites.length === 0) {
    $targetTable.append(`
      <tr><td colspan="5" style="text-align:center;">
        ${currentLang === 'ja' ? 'お気に入りがまだありません。' : 'No favorites yet.'}
      </td></tr>
    `);
    return;
  }

  // ページ分割
  const totalPages = Math.ceil(favorites.length / itemsPerPage);
  const start = (currentFavPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = favorites.slice(start, end);

  pageItems.forEach(shop => {
    const distance = getSimpleDistance(currentLat, currentLng, shop.lat, shop.lng).toFixed(2);
    const row = $(`
      <tr class="shop-row">
        <td>${shop.name}</td>
        <td>${shop.budget}</td>
        <td>${shop.genre}</td>
        <td>${distance}</td>
        <td>
          <button class="view-detail-btn" data-shop='${JSON.stringify(shop)}'>
            ${currentLang === 'ja' ? '詳細を見る' : 'Add to Detail Card'}
          </button>
          <button class="remove-btn remove-favorite" data-id="${shop.id}">
            ${currentLang === 'ja' ? '解除' : 'Remove'}
          </button>
        </td>
      </tr>
    `);
    $targetTable.append(row);
  });

   // ページネーションボタン更新
  $("#fav-pageNum").text(currentFavPage);
  $("#fav-prevBtn").prop("disabled", currentFavPage === 1);
  $("#fav-nextBtn").prop("disabled", currentFavPage === totalPages);
}

// 比較エリアのページネーションボタン動作
$("#fav-prevBtn").on("click", function () {
  if (currentFavPage > 1) {
    currentFavPage--;
    renderComparison();
  }
});

$("#fav-nextBtn").on("click", function () {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const totalPages = Math.ceil(favorites.length / itemsPerPage);
  if (currentFavPage < totalPages) {
    currentFavPage++;
    renderComparison();
  }
});
// ウィンドウリサイズ時に比較エリアを再描画
window.addEventListener("resize", () => {
  renderComparison();
});
// お気に入り削除機能
$(document).on("click", ".remove-favorite", function () {
  const id = $(this).data("id");
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites = favorites.filter(shop => shop.id !== id);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderComparison();
});
// 簡易距離計算関数
function getSimpleDistance(lat1, lng1, lat2, lng2) {
const dx = lng2 - lng1;
const dy = lat2 - lat1;
const distance = Math.sqrt(dx * dx + dy * dy);
return distance * 111; /// 1度 ≈ 111km
}
// ページ読み込み時、お気に入り比較エリア初期描画
$(document).ready(function () {
  renderComparison();
});

// ============= マップ上で公式サイトリンク・お気に入り追加機能を実装
$(document).on("click", ".info-add-favorite", function () {
const shopData = {
id: $(this).data("id"),
name: $(this).data("name"),
budget: $(this).data("budget"),
genre: $(this).data("genre"),
photo: $(this).data("photo") || "",
lat: parseFloat($(this).data("lat")),
lng: parseFloat($(this).data("lng"))
};

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
const exists = favorites.some(shop => shop.id === shopData.id);
if (!exists) {
favorites.push(shopData);
localStorage.setItem("favorites", JSON.stringify(favorites));
alert(currentLang === 'ja'
? `${shopData.name}『お気に入り』に入れました！`
: `${shopData.name} was added to favorites!`);
renderComparison();  // 比較エリアを即時更新
} else {
alert(currentLang === 'ja'
? "すでに『お気に入り』のエリアに入れました！"
: "This shop is already in favorites!");
}
});
// ============= 店舗ルート案内（取得した緯度経度を使用）
$(document).on("click", ".go-map", function (e) {
e.preventDefault(); // デフォルト動作（リンクジャンプ）を防止

const destLat = $(this).data("lat");
const destLng = $(this).data("lng");

if (currentLat && currentLng) {
const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLng}&destination=${destLat},${destLng}`;
window.open(url, "_blank");  // 新しいタブで開く
} else {
alert(currentLang === 'ja'
? "現在地をまだ取得できていません。しばらくしてから再度お試しください"
: "Unable to get your current location. Please try again later");
}
});

//================= 現在地付近のレストランおすすめ表示
function showNearbyRecommendations() {
const apiUrl = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${API_KEY}&lat=${currentLat}&lng=${currentLng}&range=3&format=json`;
const proxyUrl = PROXY + apiUrl;

fetch(proxyUrl)
.then(res => res.json())
.then(data => {
  const resultBox = document.getElementById("autoRecommendContents");
  resultBox.innerHTML = "";

  if (!data.results.shop || data.results.shop.length === 0) {
    resultBox.innerHTML = 
    currentLang === "ja"
            ? "<p>近くにおすすめレストランが見つかりませんでした。</p>"
            : "<p>No nearby restaurant recommendations found.</p>";
    return;
  }
  // 配列をランダムに並び替える関数
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
 // ランダムに並び替えて、上位3件だけ取得
const randomShops = shuffle(data.results.shop).slice(0, 3);
randomShops.forEach(shop => {   // 3件だけ表示
    const div = document.createElement("div");
    div.className = "recommendShop-card";
    div.innerHTML = `
      <h4>${shop.name}</h4>
      <p>${shop.budget.name}</p>
      <p>${shop.genre.name}</p>
      <div class="recommendBtnBOX">
     <a href="detail.html?id=${shop.id}" target="_blank">
  <button class="redBtn">
  ${currentLang === 'ja' ? 'お店の情報' : 'Shop Info'}
  </button>
</a>
      <button class="info-add-favorite" 
                data-id="${shop.id}"
                data-name="${shop.name}"
                data-budget="${shop.budget.name}"
                data-genre="${shop.genre.name}"
                data-lat="${shop.lat}"
                data-lng="${shop.lng}">
                ${currentLang === 'ja' ? 'お気に入り追加' : 'Add to Favorite'}
        </button>
      </div>  
    `;
    resultBox.appendChild(div);
  });
  switchLanguage(currentLang);// 言語設定を反映
})

.catch(err => {
  console.error("附近推荐失败：", err);
});
}
// ============= 「更新」ボタンでおすすめエリアをリフレッシュ
document.getElementById("refreshRecommendBtn").addEventListener("click", function () {
  const container = document.getElementById("autoRecommendContents");
  container.innerHTML = "<p>検索中…</p>";
  showNearbyRecommendations();
});


// ============= 詳細カードに店舗情報を追加
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("view-detail-btn")) {
    const shopData = JSON.parse(e.target.dataset.shop);
    let viewedShops = JSON.parse(localStorage.getItem("viewedShops")) || [];
    viewedShops.push(shopData);
    localStorage.setItem("viewedShops", JSON.stringify(viewedShops));
  }
});

// ============= 詳細カードページにデータ追加（localStorage）
$(document).on("click", ".view-detail-btn", function () {
  const shopInfo = JSON.parse($(this).attr("data-shop"));
  let detailCards = JSON.parse(localStorage.getItem("detailCards")) || [];
  const exists = detailCards.some(card => card.id === shopInfo.id);

  if (!exists) {
    detailCards.push(shopInfo);
    localStorage.setItem("detailCards", JSON.stringify(detailCards));
    alert(currentLang === 'ja' ? "詳細カードに追加しました！" : "Added to detail card!");
  } else {
    alert(currentLang === 'ja' ? "すでに追加されています。" : "Already added.");
  }
});

//============= モバイルメニュー（ハンバーガーメニュー）
document.addEventListener("DOMContentLoaded", function () {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileFavArea = document.getElementById("mobileFavoriteEara");

  hamburgerBtn.addEventListener("click", () => {
    mobileFavArea.classList.toggle("active");
  });
});

function toggleMenu() {
  const menu = document.querySelector('.mobile-menu');
  menu.classList.toggle('open');
}
