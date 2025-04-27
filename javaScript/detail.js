const API_KEY = "4df7b82467c564cb"; 
const params = new URLSearchParams(location.search);
const shopId = params.get("id");

let currentLang = "ja";

// 言語切り替え関数
function switchLanguage(lang) {
  currentLang = lang;
  const jaElems = document.querySelectorAll('.lang-ja');
  const enElems = document.querySelectorAll('.lang-en');

  jaElems.forEach(el => el.style.display = (lang === 'ja' ? '' : 'none'));
  enElems.forEach(el => el.style.display = (lang === 'en' ? '' : 'none'));
}

switchLanguage('ja'); // 初期言語設定（デフォルトは日本語）

// 店舗IDがURLに存在しない場合
if (!shopId) {
  alert("店舗IDが取得できませんでした");
  throw new Error("No ID found in URL");
}

// 店舗情報を取得
fetch(`http://localhost:3000/hotpepper?key=${API_KEY}&id=${shopId}&format=json`)

  .then(res => res.json())
  .then(data => {
    if (!data.results.shop || data.results.shop.length === 0) {
      alert("店舗情報の取得に失敗しました（店舗が存在しない）");
      return;
    }
    const shop = data.results.shop[0];
    // 店舗情報を画面に表示
    document.getElementById("shopName").textContent = shop.name;
    document.getElementById("shopAddress").textContent += shop.address;
    document.getElementById("shopOpen").textContent += shop.open;
    document.getElementById("shopPrice").textContent += shop.budget.name;
    document.getElementById("shopGenre").textContent += shop.genre.name;
    document.getElementById("shopImage").src = shop.photo.pc.l;
    document.getElementById("shopLink").href = shop.urls.pc;
    
    document.getElementById("shopAccess").textContent += shop.access;
    document.getElementById("shopCatch").textContent = shop.catch;
    document.getElementById("shopNonSmoking").textContent += shop.non_smoking;
    document.getElementById("shopCard").textContent += shop.card;
    document.getElementById("shopWifi").textContent += shop.wifi;
    document.getElementById("shopParking").textContent += shop.parking;
    document.getElementById("shopPrivateRoom").textContent +=  shop.private_room;

  })
  .catch(err => {
    alert("店舗情報の取得に失敗しました");
    console.error("APIエラー:", err);
  });