let currentLang = "ja"; 

document.addEventListener("DOMContentLoaded", () => {
  const tabBox = document.getElementById("tabs");
  const container = document.getElementById("detailCardsContainer");
  const detailShops = JSON.parse(localStorage.getItem("viewedShops")) || [];

  if (detailShops.length === 0) {  // 表示できる店舗詳細がない場合
    container.innerHTML = `
      <p class="lang-ja">表示できる店舗詳細がありません。</p>
      <p class="lang-en">No shop details available.</p>
    `;
    return;
  }

  detailShops.forEach((shop, index) => {
    // Tab ボタン作成
    const tab = document.createElement("div");
    tab.className = "tab";
    tab.innerText = shop.name;
    tab.dataset.index = index;
    tabBox.appendChild(tab);

    // 店舗詳細カード作成
    const card = document.createElement("div");
    card.className = "card";
    card.id = `card-${index}`;
    card.innerHTML = `
    <div class="cardText">
      <h2 class="cardShopName">${shop.name}</h2>
     <div class="cardTextLeft">
      
      <img src="${shop.photo}" alt="${shop.name}" width="250">
     </div> 
     <div class="cardTextRight">
       <p><strong class="lang-ja">住所：</strong><strong class="lang-en">Address: </strong>${shop.address}</p>
          <p><strong class="lang-ja">営業時間：</strong><strong class="lang-en">Open: </strong>${shop.open}</p>
          <p><strong class="lang-ja">ジャンル：</strong><strong class="lang-en">Genre: </strong>${shop.genre}</p>
          <p><strong class="lang-ja">アクセス：</strong><strong class="lang-en">Access: </strong>${shop.access}</p>
          <a class="cardText-a" href="${shop.link}" target="_blank">
            <p class="lang-ja">ホットペッパーで見る(予約) </p>
            <p class="lang-en">View on Hot Pepper(Reserve) </span></p>
          </a><br><br>
     </div> 
      <button data-index="${index}" class="delete-btn lang-ja">このカードを削除</button>
          <button data-index="${index}" class="delete-btn lang-en">Remove This Card</button>
    </div>  
    `;
    container.appendChild(card);
  });

  //  Tab 切り替え機能
  const tabs = document.querySelectorAll(".tab");
  const cards = document.querySelectorAll(".card");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      cards.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      const index = tab.dataset.index;
      document.getElementById(`card-${index}`).classList.add("active");
    });
  });

  // 最初のタブとカードをデフォルトでアクティブにする
  if (tabs.length > 0) {
    tabs[0].classList.add("active");
    cards[0].classList.add("active");
  }

   // 削除ボタン機能
  container.addEventListener("click", e => {
    if (e.target.classList.contains("delete-btn")) {
      const index = parseInt(e.target.dataset.index);
      detailShops.splice(index, 1);
      localStorage.setItem("viewedShops", JSON.stringify(detailShops));
      location.reload();  // ページをリロード
    }
  });
  switchLanguage("ja"); // デフォルト言語を日本語に初期化
});
 // 言語切り替え関数
 function switchLanguage(lang) {
  currentLang = lang;
  const jaElements = document.querySelectorAll('.lang-ja');
  const enElements = document.querySelectorAll('.lang-en');

  jaElements.forEach(el => el.style.display = (lang === 'ja') ? '' : 'none');
  enElements.forEach(el => el.style.display = (lang === 'en') ? '' : 'none');
}