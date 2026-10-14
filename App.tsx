import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import * as StoreReview from "expo-store-review";
import * as RNIap from "react-native-iap";
import type { Product as StoreProduct, Purchase } from "react-native-iap";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated, Dimensions, Easing, FlatList, Image, ImageBackground, Linking, Modal, Platform, Pressable,
  NativeModules, PanResponder, ScrollView, StyleSheet, Switch, Text as NativeText, TextProps, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  COLORS, createLevel, inverseMove, LEVEL_LAYERS, PRACTICE_LAYER, PRACTICE_LEVELS,
  layerColorCount, layerLevelCount, levelInfo, LayerConfig, Move, shift, simplifyMovePath, TOTAL_LEVELS,
} from "./src/game";
import { DEFAULT_SAVE, loadSave, PlayerSave, writeSave } from "./src/storage";
import { C } from "./src/theme";

type Screen = "splash" | "language" | "onboarding" | "practiceComplete" | "layerUnlocked" | "home" | "levels" | "game" | "reward";
type Sheet = null | "shop" | "settings" | "reset";
type Language = "tr" | "en";

const EN_TEXT: Record<string, string> = {
  "Her esinti yeni bir yol açar": "Every breeze reveals a new path",
  "ÜCRETSİZ": "FREE",
  "3/3 ALIŞTIRMA TAMAMLANDI": "3/3 TUTORIAL COMPLETE",
  "Gerçek eğlence şimdi başlıyor!": "Now the real fun begins!",
  "2×3 eğitim bahçesini tamamladın. Şimdi daha büyük tahtalar, daha uzun kaydırmalar ve gerçek bulmacalar başlıyor.": "You completed the 2×3 training garden. Bigger boards, longer slides and true puzzles begin now.",
  "2×3  ✓ ALIŞTIRMA": "2×3  ✓ TUTORIAL",
  "3×3  FİLİZ": "3×3  SPROUT",
  "FİLİZ AVLUSU · 3×3 · 2 RENK": "SPROUT COURTYARD · 3×3 · 2 COLORS",
  "3×3 İLK BÖLÜME BAŞLA": "START THE FIRST 3×3 LEVEL",
  "Birkaç saniye sonra otomatik başlayacak": "Starts automatically in a few seconds",
  "YENİ KATMAN AÇILDI": "NEW LAYER UNLOCKED",
  "Tebrikler!": "Congratulations!",
  "Yeni bahçenin ilk bölümü birazdan açılacak.": "The first level of your new garden is about to open.",
  "İLK BÖLÜME BAŞLA": "START THE FIRST LEVEL",
  "NASIL OYNANIR": "HOW TO PLAY",
  "ATLA": "SKIP",
  "Bahçeyi uyandır": "Awaken the garden",
  "Çiçekleri tek tek değil, bütün bir satırı veya sütunu kaydırarak arka plandaki renk düzeniyle eşleştir.": "Slide an entire row or column—not individual flowers—to match the colored background pattern.",
  "Bir sıra seç": "Choose a line",
  "Parmağını bir çiçeğin üzerine koy.": "Place your finger on a flower.",
  "Düz yönde sürükle": "Slide in a straight line",
  "Sağa, sola, yukarı veya aşağı hareket et.": "Move right, left, up or down.",
  "Renkleri eşleştir": "Match the colors",
  "Her çiçeği kendi rengindeki zemine getir.": "Move every flower onto its matching ground color.",
  "HEDEFİ OKU": "READ THE TARGET",
  "Arka plan renkleri hedefindir": "The background colors are your target",
  "Her karenin zemini, oraya gelmesi gereken çiçeğin rengini gösterir. Yeşil zemine yeşil, sarı zemine sarı çiçek gelmelidir.": "Each tile shows the flower color that belongs there. Green flowers go on green tiles and yellow flowers on yellow tiles.",
  "Önemli": "Important",
  "Zeminler hareket etmez. Sadece üzerlerindeki çiçekler kayar.": "The ground never moves. Only the flowers slide.",
  "YATAY HAREKET": "HORIZONTAL MOVE",
  "Satır, halka gibi döner": "Rows wrap around like a loop",
  "Satırı sağa sürüklediğinde bütün çiçekler sağa gider. En sağdaki çiçek kaybolmaz; aynı satırın en solundan geri gelir.": "Slide a row right and every flower moves right. The last flower wraps around and returns from the left.",
  "EN SAĞDAKİ  →  EN SOLA": "RIGHTMOST  →  LEFTMOST",
  "Sola sürüklersen bunun tam tersi olur: en soldaki çiçek en sağdan geri gelir.": "Slide left and the opposite happens: the leftmost flower returns from the right.",
  "DİKEY HAREKET": "VERTICAL MOVE",
  "Sütun da aynı şekilde döner": "Columns wrap around too",
  "Sütunu aşağı sürüklediğinde bütün çiçekler aşağı iner. En alttaki çiçek aynı sütunun en üstünden geri gelir.": "Slide a column down and every flower moves down. The bottom flower returns from the top.",
  "EN ALTTAKİ  ↓  EN ÜSTE": "BOTTOM  ↓  TOP",
  "Yukarı sürüklersen en üstteki çiçek en alttan geri gelir.": "Slide up and the top flower returns from the bottom.",
  "BÖLÜMÜ TAMAMLA": "COMPLETE THE LEVEL",
  "Bütün renkler eşleşince kazanırsın": "Match every color to win",
  "Her çiçek kendi rengindeki zeminin üzerindeyse bahçe tamamlanır. Uzak bir sırayı birden fazla kare sürükleyebilirsin.": "The garden is complete when every flower matches its tile. You can slide a line across several spaces at once.",
  "✓ Bir çiçeği değil, tüm sırayı hareket ettirirsin.": "✓ You move the whole line, not one flower.",
  "✓ İlk 3 ipucun ücretsizdir.": "✓ Your first 3 hints are free.",
  "✓ Takılırsan ampul düğmesi doğru hamleyi gösterir.": "✓ If you get stuck, the bulb shows the right move.",
  "GERİ": "BACK",
  "OYUNA BAŞLA": "START PLAYING",
  "DEVAM ET": "CONTINUE",
  "✓ Aynı renk: doğru": "✓ Same color: correct",
  "≠ Farklı renk: değiştir": "≠ Different color: move it",
  "SAĞA  →   ·   ←  SOLA GERİ": "RIGHT  →   ·   ←  BACK LEFT",
  "AŞAĞI  ↓   ·   ↑  YUKARI GERİ": "DOWN  ↓   ·   ↑  BACK UP",
  "FİLİZ · BÖLÜM 1": "SPROUT · LEVEL 1",
  "HAMLE 4": "MOVES 4",
  "✓ TÜM RENKLER EŞLEŞTİ": "✓ ALL COLORS MATCH",
  "YENİ KATMANI AÇ": "UNLOCK NEW LAYER",
  "BÖLÜMLER": "LEVELS",
  "MAĞAZA": "SHOP",
  "AYARLAR": "SETTINGS",
  "Bahçe Katmanları": "Garden Layers",
  "Katmanları sırayla 50 Koru Taşı ile aç · Önceki bölümleri bitirmen gerekmez": "Unlock layers in order with 50 Grove Stones · You do not need to finish every previous level",
  "ÖNCE ALIŞTIRMAYI TAMAMLA": "COMPLETE THE TUTORIAL FIRST",
  "2×3 sekmesindeki 3 kısa bölümü bitirdiğinde gerçek katmanlar açılır.": "Complete the 3 short levels in the 2×3 tab to unlock the main layers.",
  "Katmanlar sırayla açılır. Bölümleri tamamlaman gerekmez.": "Layers unlock in order. You do not need to complete every level.",
  "KATMAN KİLİTLİ": "LAYER LOCKED",
  "KATMANI AÇ": "UNLOCK LAYER",
  "KİLİT": "LOCKED",
  "Bir sırayı istediğin kadar sürükle": "Slide a line as far as you want",
  "BAHÇE UYANDI": "GARDEN AWAKENED",
  "Bahçe uyandı!": "The garden awakened!",
  "Harika! 3 yıldızlık çözüm.": "Excellent! 3-star solution.",
  "Güzel çözüm! Biraz daha az hamleyle 3 yıldız.": "Nice solve! Use fewer moves for 3 stars.",
  "Bölüm tamamlandı. Daha kısa çözümle yıldızını artır.": "Level complete. Improve your stars with a shorter solve.",
  "ÖDÜLLER": "REWARDS",
  "İpucu Yaprağı": "Hint Leaf",
  "Katman Taşı": "Layer Stone",
  "ÖDÜLÜ AL · DEVAM": "CLAIM REWARD · CONTINUE",
  "REKLAM AÇILIYOR…": "OPENING AD…",
  "✓ ÖDÜL 2× OLDU": "✓ REWARD DOUBLED",
  "▶ REKLAM İZLE · 2× KAZAN": "▶ WATCH AD · EARN 2×",
  "DEVAM EDİLİYOR…": "CONTINUING…",
  "ÜCRETSİZ HAKLAR BİTTİ": "FREE HINTS USED",
  "İpucu kullanılsın mı?": "Use a hint?",
  "Bir sonraki doğru hamle gösterilecek ve bakiyenden 3 İpucu Yaprağı eksilecek.": "The next correct move will be shown and 3 Hint Leaves will be deducted.",
  "3 YAPRAK KULLAN": "USE 3 LEAVES",
  "VAZGEÇ": "CANCEL",
  "YENİ BAHÇE KATMANI": "NEW GARDEN LAYER",
  "KORU TAŞI YETERSİZ": "NOT ENOUGH GROVE STONES",
  "MAĞAZAYA GİT": "GO TO SHOP",
  "ŞİMDİ DEĞİL": "NOT NOW",
  "Bölümü sıfırla": "Reset level",
  "Bu bölümü sıfırlamak istiyor musunuz?": "Do you want to reset this level?",
  "SIFIRLA": "RESET",
  "Ayarlar": "Settings",
  "Müzik": "Music",
  "Ses efektleri": "Sound effects",
  "Titreşim": "Haptics",
  "Dil": "Language",
  "TANITIMI TEKRAR İNCELE": "VIEW TUTORIAL AGAIN",
  "Koru Dükkânı": "Grove Shop",
  "Test mağazası açık. Paketi seçip açılan ekrandan onaylayabilirsin.": "The test shop is open. Select a pack and confirm it in the pop-up.",
  "Satın alma paketleri yakında açılacak.": "Purchase packs are coming soon.",
  "App Store satın alma paketleri hazır. Paket seçip Apple ödeme ekranından onaylayabilirsin.": "App Store purchase packs are ready. Select a pack and confirm it on the Apple payment sheet.",
  "Satın alma sistemi hazırlanıyor. Lütfen birkaç saniye sonra tekrar dene.": "The purchase system is getting ready. Please try again in a few seconds.",
  "Satın alma penceresi açılıyor…": "Opening purchase sheet…",
  "Satın alma başlatılamadı. Lütfen bağlantını ve App Store hesabını kontrol edip tekrar dene.": "The purchase could not be started. Please check your connection and App Store account, then try again.",
  "Satın alma tamamlandı. Paket bakiyene eklendi.": "Purchase complete. The pack was added to your balance.",
  "Reklam Engelleme aktif edildi.": "Remove Ads has been activated.",
  "İpucu Yaprakları": "Hint Leaves",
  "Koru Taşları": "Grove Stones",
  "Reklam Engelleme": "Remove Ads",
  "Satın Alma Geçmişi": "Purchase History",
  "Henüz satın alma yok": "No purchases yet",
  "Son satın almaların burada görünür.": "Recent purchases appear here.",
  "Koru Taşları iOS'ta bölüm ödülleriyle kazanılır. Katmanlar oyun içi ilerlemeyle açılır.": "Grove Stones are earned from level rewards on iOS. Layers unlock through in-game progress.",
  "Zorunlu geçiş reklamlarını kalıcı olarak kapatır.": "Permanently removes forced interstitial ads.",
  "Reklam engelleme zaten açık.": "Remove Ads is already active.",
  "AKTİF": "ACTIVE",
  "TEST MODU · GERÇEK ÖDEME ALINMAZ": "TEST MODE · NO REAL PAYMENT",
  "YAKINDA": "COMING SOON",
  "SATIN ALMALARI GERİ YÜKLE": "RESTORE PURCHASES",
  "GERİ YÜKLENİYOR…": "RESTORING…",
  "Geri yükleme tamamlandı. Reklam Engelleme aktif.": "Restore complete. Remove Ads is active.",
  "Geri yüklenebilecek kalıcı satın alma bulunamadı.": "No restorable non-consumable purchase was found.",
  "Satın alma geri yüklenemedi. Lütfen daha sonra tekrar dene.": "Purchases could not be restored. Please try again later.",
  "PAKETİ ONAYLA": "CONFIRM PACK",
  "Bu paket bakiyene eklenecek. Satın alma işlemini onaylıyor musun?": "This pack will be added to your balance. Do you confirm the purchase?",
  "SATIN ALMAYI ONAYLA": "CONFIRM PURCHASE",
  "SATIN AL": "BUY",
  "DOKUN · TEST AL": "TAP · TEST BUY",
  "Rüzgâr Okulu": "Wind School", "Alıştırma": "Tutorial",
  "Filiz Avlusu": "Sprout Courtyard", "Filiz": "Sprout",
  "Yonca Yolu": "Clover Path", "Yonca": "Clover",
  "Rüzgâr Bahçesi": "Wind Garden", "Rüzgâr": "Wind",
  "Mercan Terası": "Coral Terrace", "Mercan": "Coral",
  "Lavanta Korusu": "Lavender Grove", "Lavanta": "Lavender",
  "Ayışığı Serası": "Moonlight Greenhouse", "Ayışığı": "Moonlight",
  "Dikey Yoncalar": "Vertical Clovers", "Yoncalar": "Clovers",
  "Kristal Bahçe": "Crystal Garden", "Kristal": "Crystal",
  "Göğe Uzanan Koru": "Skyward Grove", "Gökyüzü": "Sky",
  "Kadim Çiçeklik": "Ancient Flowerbed", "Kadim": "Ancient",
  "Yıldız Çayırı": "Star Meadow", "Yıldız": "Star",
  "Sonsuz Sarmaşık": "Endless Ivy", "Sarmaşık": "Ivy",
  "Ödülün 2× oldu": "Your reward is now 2×",
  "Ödül için reklamı tamamlamalısın": "Complete the ad to earn the reward",
  "PETAL SHIFT'I DEĞERLENDİR": "RATE PETAL SHIFT",
  "Oyunu seviyorsan bize destek olur musun?": "If you enjoy the game, would you support us?",
  "Kısa bir App Store değerlendirmesi yeni oyunculara ulaşmamıza yardımcı olur.": "A quick App Store review helps us reach new players.",
  "DEĞERLENDİR": "RATE NOW",
  "DAHA SONRA": "LATER",
  "YENİ GÜNCELLEME VAR": "NEW UPDATE AVAILABLE",
  "Petal Shift için yeni bir sürüm hazır. En iyi deneyim için App Store'dan güncelle.": "A new version of Petal Shift is ready. Update from the App Store for the best experience.",
  "GÜNCELLE": "UPDATE",
  "Bu bölüm henüz kilitli": "This level is still locked",
  "Bu bölüm zaten çözüm yolunun sonunda": "This level is already at the end of its solution path",
  "İpucu yaprağın kalmadı": "You have no Hint Leaves left",
  "Reklam hazırlanıyor, biraz sonra tekrar dene": "The ad is loading. Please try again shortly",
  "Reklam açılamadı, lütfen tekrar dene": "The ad could not open. Please try again",
};

const EN_REPLACEMENTS: Array<[string, string]> = [
  ["RÜZGÂR OKULU", "WIND SCHOOL"], ["ALIŞTIRMA", "TUTORIAL"],
  ["FİLİZ AVLUSU", "SPROUT COURTYARD"], ["FİLİZ", "SPROUT"],
  ["YONCA YOLU", "CLOVER PATH"], ["YONCA", "CLOVER"],
  ["RÜZGÂR BAHÇESİ", "WIND GARDEN"], ["RÜZGÂR", "WIND"],
  ["MERCAN TERASI", "CORAL TERRACE"], ["MERCAN", "CORAL"],
  ["LAVANTA KORUSU", "LAVENDER GROVE"], ["LAVANTA", "LAVENDER"],
  ["AYIŞIĞI SERASI", "MOONLIGHT GREENHOUSE"], ["AYIŞIĞI", "MOONLIGHT"],
  ["DİKEY YONCALAR", "VERTICAL CLOVERS"], ["YONCALAR", "CLOVERS"],
  ["KRİSTAL BAHÇE", "CRYSTAL GARDEN"], ["KRİSTAL", "CRYSTAL"],
  ["GÖĞE UZANAN KORU", "SKYWARD GROVE"], ["GÖKYÜZÜ", "SKY"],
  ["KADİM ÇİÇEKLİK", "ANCIENT FLOWERBED"], ["KADİM", "ANCIENT"],
  ["YILDIZ ÇAYIRI", "STAR MEADOW"], ["YILDIZ", "STAR"],
  ["SONSUZ SARMAŞIK", "ENDLESS IVY"], ["SARMAŞIK", "IVY"],
  ["Filiz", "Sprout"], ["Yonca", "Clover"], ["Rüzgâr", "Wind"],
  ["Mercan", "Coral"], ["Lavanta", "Lavender"], ["Ayışığı", "Moonlight"],
  ["Yoncalar", "Clovers"], ["Kristal", "Crystal"], ["Gökyüzü", "Sky"],
  ["Kadim", "Ancient"], ["Yıldız", "Star"], ["Sarmaşık", "Ivy"],
  ["OYNA", "PLAY"],
  ["Bu katman için 50 Koru Taşı gerekiyor. Mağazadan Koru Taşı almak ister misin?", "This layer requires 50 Grove Stones. Would you like to get more from the shop?"],
  ["Koru Taşı gerekiyor. Mağazadan Koru Taşı almak ister misin?", "Grove Stones. Would you like to get more from the shop?"],
  ["BÖLÜM", "LEVEL"], ["Bölüm", "Level"], ["HAMLE", "MOVES"],
  ["YENİ BAHÇE", "NEW GARDEN"], ["YENİ BÖLÜM", "NEW LEVELS"],
  ["RENK", "COLORS"], ["renk", "colors"], ["tamamlandı", "completed"],
  ["KİLİTLİ", "LOCKED"], ["Koru Taşı", "Grove Stones"],
  ["Mevcut bakiye:", "Current balance:"], ["taş eksik", "stones missing"],
  ["henüz açılamıyor", "cannot be unlocked yet"], ["TAŞLA AÇ", "STONES TO UNLOCK"],
  ["Önce", "Unlock"], ["ÖNCE", "UNLOCK"], ["önceki", "previous"], ["katmanını açmalısın", "layer first"], ["KATMANINI AÇ", "LAYER FIRST"],
  ["hamlede tamamladın · Ödüllerin hazır", "moves · Your rewards are ready"],
  ["Bu katman için", "This layer requires"],
  ["Bu katmanı açtığında 50 yeni bölüm oynanabilir olacak.", "Unlock this layer to open 50 new levels."],
];

const LanguageContext = React.createContext<Language>("tr");

function translateUiString(value: string, language: Language) {
  if (language === "tr" || !value.trim()) return value;
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.trim();
  let translated = EN_TEXT[core] ?? core;
  if (translated === core) {
    EN_REPLACEMENTS.forEach(([from, to]) => { translated = translated.replaceAll(from, to); });
  }
  return `${leading}${translated}${trailing}`;
}

function Text({ children, ...props }: TextProps) {
  const language = React.useContext(LanguageContext);
  const localized = React.Children.map(children, (child) =>
    typeof child === "string" ? translateUiString(child, language) : child);
  return <NativeText {...props}>{localized}</NativeText>;
}
const LAYER_UNLOCK_COST = 50;
const DISPLAY_LAYERS = [PRACTICE_LAYER, ...LEVEL_LAYERS];
const CURRENT_APP_VERSION = "1.0.7";
const APP_STORE_ID = process.env.EXPO_PUBLIC_APP_STORE_ID ?? "";
const APP_STORE_URL = APP_STORE_ID ? `itms-apps://apps.apple.com/app/id${APP_STORE_ID}` : "";
// Geçici test anahtarı: true iken cihazdaki kayıt okunmaz veya değiştirilmez.
// Yayın öncesinde false yapmak eski kalıcı kayıt sistemini yeniden etkinleştirir.
const TEST_RESET_ON_LAUNCH = false;
const UiSoundContext = React.createContext<() => void>(() => undefined);
const ADS_AVAILABLE = Platform.OS !== "web" && !!NativeModules.RNGoogleMobileAdsModule;
const GoogleAds = ADS_AVAILABLE ? require("react-native-google-mobile-ads") : null;
const mobileAds = GoogleAds?.default ?? (() => ({ initialize: async () => undefined }));
const AdEventType = GoogleAds?.AdEventType ?? { LOADED: "loaded", CLOSED: "closed", ERROR: "error" };
const RewardedAdEventType = GoogleAds?.RewardedAdEventType ?? { LOADED: "rewarded_loaded", EARNED_REWARD: "earned_reward" };
const AdsConsent = GoogleAds?.AdsConsent ?? { gatherConsent: async () => ({ canRequestAds: false }) };
const TestIds = GoogleAds?.TestIds ?? {
  INTERSTITIAL: "ca-app-pub-3940256099942544/1033173712",
  REWARDED: "ca-app-pub-3940256099942544/5224354917",
};
const createNoopAd = () => ({
  addAdEventListener: () => () => undefined,
  load: () => undefined,
  show: () => Promise.reject(new Error("Ads are not available in this runtime")),
});
const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID || TestIds.INTERSTITIAL
    : process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID || TestIds.INTERSTITIAL;
const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID || TestIds.REWARDED
    : process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID || TestIds.REWARDED;
const interstitialAd = ADS_AVAILABLE
  ? GoogleAds.InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, { requestNonPersonalizedAdsOnly: false })
  : createNoopAd();
const rewardedAd = ADS_AVAILABLE
  ? GoogleAds.RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, { requestNonPersonalizedAdsOnly: false })
  : createNoopAd();

function layerSizeLabel(layer: LayerConfig) {
  // Mercan is intentionally portrait: 5 cells vertically, 4 horizontally.
  return layer.id === 4 ? "5×4" : `${layer.cols}×${layer.rows}`;
}

function layerPaletteLabel(layer: LayerConfig) {
  if (layer.id >= 1 && layer.id <= 4) return "2-3";
  if (layer.id === 5) return "2-3";
  if (layer.id >= 6) return "2-5";
  return String(layerColorCount(layer));
}

function levelStarScore(moves: number, idealMoves: number) {
  if (moves <= idealMoves) return 3;
  if (moves <= idealMoves + 4) return 2;
  return 1;
}

const { width, height } = Dimensions.get("window");
// Keep enough room for side controls while using more of the phone width.
const BOARD_SIZE = Math.max(240, Math.min(width - 28, 360));
// Small phones must never be forced to render a 300px-tall board. Reserving
// space for the header/actions keeps 8-row gardens inside the safe viewport.
const BOARD_HEIGHT_LIMIT = Math.max(220, Math.min(500, height - 300));
const BOTANICAL_BACKGROUND = require("./assets/hd/botanical-background.png");
const APP_ICON = require("./assets/hd/app-icon.png");
const COMPANY_LOGO = require("./assets/company-logo.png");
const AUDIO = {
  music: require("./assets/audio/garden-loop.wav"),
  slide: require("./assets/audio/slide.wav"),
  settle: require("./assets/audio/settle.wav"),
  hint: require("./assets/audio/hint.wav"),
  complete: require("./assets/audio/complete.wav"),
  reward: require("./assets/audio/reward.wav"),
  transition: require("./assets/audio/transition.wav"),
  button: require("./assets/audio/button.wav"),
  drag: require("./assets/audio/drag.wav"),
};
const UI = {
  button: require("./assets/ui-v3/button-normal.png"),
  buttonPressed: require("./assets/ui-v3/button-pressed.png"),
  buttonDisabled: require("./assets/ui-v3/button-disabled.png"),
  back: require("./assets/ui-v3/icon-back.png"),
  reset: require("./assets/ui-v3/icon-reset.png"),
  hint: require("./assets/ui-v3/icon-hint.png"),
  check: require("./assets/ui-v3/icon-check.png"),
  gate: require("./assets/ui-v3/chapter-gate.png"),
  chapterCard: require("./assets/ui-v3/chapter-card.png"),
  progressVine: require("./assets/ui-v3/progress-vine.png"),
  levelNormal: require("./assets/ui-v3/level-normal.png"),
  levelCompleted: require("./assets/ui-v3/level-completed.png"),
  levelCurrent: require("./assets/ui-v3/level-current.png"),
  frameTop: require("./assets/ui-v3/frame-top.png"),
  frameBottom: require("./assets/ui-v3/frame-bottom.png"),
  frameLeft: require("./assets/ui-v3/frame-left.png"),
  frameRight: require("./assets/ui-v3/frame-right.png"),
  frameCorner: require("./assets/ui-v3/frame-corner.png"),
  currencyGreen: require("./assets/ui-v3/currency-green.png"),
  currencyLavender: require("./assets/ui-v3/currency-lavender.png"),
  home: require("./assets/ui-v4/icon-home.png"),
  levels: require("./assets/ui-v4/icon-levels.png"),
  shop: require("./assets/ui-v4/icon-shop.png"),
  noAds: require("./assets/ui-v4/icon-no-ads-red.png"),
  settings: require("./assets/ui-v4/icon-settings.png"),
  currencyLeaf: require("./assets/ui-v4/icon-currency-leaf.png"),
  currencyStone: require("./assets/ui-v3/icon-currency-stone.png"),
  starFilled: require("./assets/ui-v4/star-filled.png"),
  starEmpty: require("./assets/ui-v4/star-empty.png"),
};
const FLOWER_ASSETS = [
  require("./assets/ui-v3/flower-sage.png"),
  require("./assets/ui-v3/flower-coral.png"),
  require("./assets/ui-v3/flower-gold.png"),
  require("./assets/ui-v3/flower-lavender.png"),
  require("./assets/ui-v3/flower-neutral.png"),
];
const SOIL_ASSETS = [
  require("./assets/ui-v3/soil-sage.png"),
  require("./assets/ui-v3/soil-coral.png"),
  require("./assets/ui-v3/soil-gold.png"),
  require("./assets/ui-v3/soil-lavender.png"),
  require("./assets/ui-v3/soil-cream.png"),
];
const ONBOARDING_SOIL_COLORS = ["#79B987", "#E98C72", "#F2C94C", "#9B8BC5"];

function PetalMark({ small = false }: { small?: boolean }) {
  const size = small ? 54 : 104;
  return <View style={[styles.mark, { width: size, height: size, borderRadius: size / 2 }]}>
    {[0, 45, 90, 135].map((r) => <View key={r} style={[styles.petal, {
      width: size * .34, height: size * .22, left: size * .33, top: size * .39,
      borderRadius: size * .16, transform: [{ rotate: `${r}deg` }, { translateY: -size * .18 }],
    }]} />)}
    <View style={[styles.center, { width: size * .18, height: size * .18, borderRadius: size, left: size * .41, top: size * .41 }]} />
  </View>;
}

function TButton({ title, onPress, secondary = false, disabled = false }: {
  title: string; onPress: () => void; secondary?: boolean; disabled?: boolean;
}) {
  const sound = React.useContext(UiSoundContext);
  return <Pressable disabled={disabled} onPress={() => { sound(); onPress(); }} style={({ pressed }) => [
    styles.bigButton, secondary && styles.secondaryButton, pressed && styles.pressed, disabled && { opacity: .45 },
  ]}><Text style={[styles.bigButtonText, secondary && { color: C.deep }]}>{title}</Text></Pressable>;
}

function RoundButton({ text, onPress, badge, cost, freeHints, icon }: {
  text?: string; onPress: () => void; badge?: number; cost?: number; freeHints?: number; icon?: any;
}) {
  const sound = React.useContext(UiSoundContext);
  return <Pressable onPress={() => { sound(); onPress(); }} style={({ pressed }) => [styles.assetIconButton, pressed && styles.pressed]}>
    <Image source={icon || UI.button} resizeMode="contain" style={styles.assetIconImage} />
    {!!text && <Text style={styles.assetIconGlyph}>{text}</Text>}
    {badge !== undefined && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
    {freeHints !== undefined && freeHints > 0 && <View style={styles.freeHintBadge}>
      <Text style={styles.freeHintLabel}>ÜCRETSİZ</Text>
      <Text style={styles.freeHintCount}>{freeHints}</Text>
    </View>}
    {cost !== undefined && <View style={styles.hintPriceBadge}>
      <Image source={UI.currencyLeaf} style={styles.hintPriceIcon} resizeMode="contain" />
      <Text style={styles.hintPriceText}>{cost}</Text>
    </View>}
  </Pressable>;
}

function Balances({ save }: { save: PlayerSave }) {
  return <View style={styles.balances}>
    <View style={styles.balance}><Image source={UI.currencyLeaf} style={styles.currencyIcon} resizeMode="contain" /><Text style={styles.balanceText}>{save.hintLeaves}</Text></View>
    <View style={styles.balance}><Image source={UI.currencyStone} style={styles.currencyIcon} resizeMode="contain" /><Text style={styles.balanceText}>{save.layerStones}</Text></View>
  </View>;
}

function levelIsUnlocked(save: PlayerSave, level: number) {
  const info = levelInfo(level);
  if (info.layer.id === 0) {
    return level === 1 || save.completed.includes(level) || save.completed.includes(level - 1);
  }
  if (!save.tutorialCompleted) return false;
  if (!save.unlockedLayers.includes(info.layer.id)) return false;
  return level === info.layer.start || save.completed.includes(level) || save.completed.includes(level - 1);
}

function preferredLayerId(save: PlayerSave) {
  const info = levelInfo(save.currentLevel);
  if (info.layer.id === 0) return 0;
  const waitingForNext = save.completed.includes(save.currentLevel)
    && info.localLevel === layerLevelCount(info.layer)
    && info.layer.id < LEVEL_LAYERS.length
    && !save.unlockedLayers.includes(info.layer.id + 1);
  return waitingForNext ? info.layer.id + 1 : info.layer.id;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [save, setSave] = useState<PlayerSave>(DEFAULT_SAVE);
  const [ready, setReady] = useState(false);
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [rewardDoubled, setRewardDoubled] = useState(false);
  const [rewardAccepting, setRewardAccepting] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [interstitialReady, setInterstitialReady] = useState(false);
  const [rewardedAdReady, setRewardedAdReady] = useState(false);
  const [toast, setToast] = useState("");
  const [hintConfirmVisible, setHintConfirmVisible] = useState(false);
  const [pendingLayerUnlock, setPendingLayerUnlock] = useState<number | null>(null);
  const [insufficientLayerId, setInsufficientLayerId] = useState<number | null>(null);
  const [reviewPromptVisible, setReviewPromptVisible] = useState(false);
  const [updatePromptVersion, setUpdatePromptVersion] = useState("");
  const [celebratingLayerId, setCelebratingLayerId] = useState<number | null>(null);
  const [transitioningToLevel, setTransitioningToLevel] = useState<number | null>(null);
  const [activeMove, setActiveMove] = useState<Move | null>(null);
  const [animatingMove, setAnimatingMove] = useState(false);
  const [levelCompleting, setLevelCompleting] = useState(false);
  const [reviewingOnboarding, setReviewingOnboarding] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const homeEntrance = useRef(new Animated.Value(0)).current;
  const levelsEntrance = useRef(new Animated.Value(1)).current;
  const gameEntrance = useRef(new Animated.Value(1)).current;
  const completionProgress = useRef(new Animated.Value(0)).current;
  const levelTransitionProgress = useRef(new Animated.Value(0)).current;
  const slideProgress = useRef(new Animated.Value(0)).current;
  const autoOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interstitialContinuation = useRef<null | (() => void)>(null);
  const interstitialReadyRef = useRef(false);
  const interstitialWaitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingInterstitialShow = useRef(false);
  const rewardedEarned = useRef(false);
  const rewardedRequested = useRef(false);
  const rewardAcceptingRef = useRef(false);
  const pendingPaidHint = useRef<{
    move: Move;
    duration: number;
    animate?: (duration: number) => void;
  } | null>(null);
  const solutionPath = useRef<Move[]>([]);
  const levelData = useMemo(() => createLevel(save.currentLevel), [save.currentLevel]);
  const idealMoves = useMemo(
    () => simplifyMovePath(levelData.target, levelData.scramble, levelData.rows, levelData.cols).length,
    [levelData],
  );
  const musicPlayer = useAudioPlayer(AUDIO.music);
  const slideSound = useAudioPlayer(AUDIO.slide);
  const settleSound = useAudioPlayer(AUDIO.settle);
  const hintSound = useAudioPlayer(AUDIO.hint);
  const completeSound = useAudioPlayer(AUDIO.complete);
  const rewardSound = useAudioPlayer(AUDIO.reward);
  const transitionSound = useAudioPlayer(AUDIO.transition);
  const buttonSound = useAudioPlayer(AUDIO.button);
  const dragSound = useAudioPlayer(AUDIO.drag);

  function clearInterstitialWait() {
    if (!interstitialWaitTimer.current) return;
    clearTimeout(interstitialWaitTimer.current);
    interstitialWaitTimer.current = null;
  }

  function continueAfterInterstitial() {
    clearInterstitialWait();
    pendingInterstitialShow.current = false;
    const continuation = interstitialContinuation.current;
    interstitialContinuation.current = null;
    continuation?.();
  }

  function showLoadedInterstitial() {
    if (!ADS_AVAILABLE) {
      continueAfterInterstitial();
      return false;
    }
    if (!interstitialContinuation.current) return false;
    clearInterstitialWait();
    pendingInterstitialShow.current = false;
    interstitialReadyRef.current = false;
    setInterstitialReady(false);
    interstitialAd.show().catch(() => {
      continueAfterInterstitial();
      interstitialAd.load();
    });
    return true;
  }

  function compareVersions(a: string, b: string) {
    const left = a.split(".").map((part) => Number(part) || 0);
    const right = b.split(".").map((part) => Number(part) || 0);
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
      const diff = (left[index] ?? 0) - (right[index] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  function openAppStore() {
    if (Platform.OS !== "ios" || !APP_STORE_URL) return;
    Linking.openURL(APP_STORE_URL).catch(() => undefined);
  }

  useEffect(() => {
    const initialSave = TEST_RESET_ON_LAUNCH
      ? Promise.resolve<PlayerSave>({
        ...DEFAULT_SAVE,
        completed: [],
        rewarded: [],
        unlockedLayers: [1],
        bestMoves: {},
        settings: { ...DEFAULT_SAVE.settings },
      })
      : loadSave();
    initialSave.then((value) => {
      setSave(value);
      setReady(true);
      Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(fade, {
          toValue: 0, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true,
        }).start(() => {
          if (!value.languageChosen) {
            setScreen("language");
          } else if (value.onboardingSeen) {
            homeEntrance.setValue(0);
            setScreen("home");
            requestAnimationFrame(() => {
              Animated.timing(homeEntrance, {
                toValue: 1, duration: 720, easing: Easing.bezier(.2, .9, .25, 1),
                useNativeDriver: true,
              }).start();
            });
          } else {
            setScreen("onboarding");
          }
        });
      }, 1150);
    });
  }, []);

  useEffect(() => {
    if (ready && !TEST_RESET_ON_LAUNCH) writeSave(save);
  }, [save, ready]);
  useEffect(() => {
    if (!ready || Platform.OS !== "ios" || TEST_RESET_ON_LAUNCH || !APP_STORE_ID) return;
    let active = true;
    (async () => {
      try {
        const response = await fetch(`https://itunes.apple.com/lookup?id=${APP_STORE_ID}`);
        const data = await response.json();
        const latestVersion = data?.results?.[0]?.version;
        if (
          active
          && typeof latestVersion === "string"
          && compareVersions(latestVersion, CURRENT_APP_VERSION) > 0
          && save.lastUpdatePromptVersion !== latestVersion
        ) {
          setUpdatePromptVersion(latestVersion);
        }
      } catch {
        // Update checks are helpful, but the game must open normally offline.
      }
    })();
    return () => { active = false; };
  }, [ready, save.lastUpdatePromptVersion]);
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: "mixWithOthers",
      shouldPlayInBackground: false,
    }).catch(() => undefined);
    musicPlayer.loop = true;
    musicPlayer.volume = .16;
    slideSound.volume = .24;
    settleSound.volume = .3;
    hintSound.volume = .34;
    completeSound.volume = .38;
    rewardSound.volume = .3;
    transitionSound.volume = .22;
    buttonSound.volume = .28;
    dragSound.volume = .2;
  }, []);
  useEffect(() => {
    if (!ready) return;
    const syncMusic = (isLoaded = musicPlayer.isLoaded, playing = musicPlayer.playing) => {
      if (!isLoaded) return;
      try {
        if (save.settings.music && !playing) musicPlayer.play();
        else if (!save.settings.music && playing) musicPlayer.pause();
      } catch {
        // Audio must remain optional; a native player failure cannot stop the game.
      }
    };
    syncMusic();
    let handledInitialLoad = musicPlayer.isLoaded;
    const subscription = musicPlayer.addListener("playbackStatusUpdate", (status) => {
      if (!handledInitialLoad && status.isLoaded) {
        handledInitialLoad = true;
        syncMusic(true, status.playing);
      }
    });
    return () => subscription.remove();
  }, [ready, save.settings.music, musicPlayer]);
  useEffect(() => {
    if (!ADS_AVAILABLE) return;
    let active = true;
    let interstitialRetry: ReturnType<typeof setTimeout> | null = null;
    let rewardedRetry: ReturnType<typeof setTimeout> | null = null;
    const reloadInterstitial = (delay = 500) => {
      if (interstitialRetry) clearTimeout(interstitialRetry);
      interstitialRetry = setTimeout(() => {
        if (active) interstitialAd.load();
      }, delay);
    };
    const reloadRewarded = (delay = 500) => {
      if (rewardedRetry) clearTimeout(rewardedRetry);
      rewardedRetry = setTimeout(() => {
        if (active) rewardedAd.load();
      }, delay);
    };
    const subscriptions = [
      interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        interstitialReadyRef.current = true;
        setInterstitialReady(true);
        if (pendingInterstitialShow.current) showLoadedInterstitial();
      }),
      interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        interstitialReadyRef.current = false;
        setInterstitialReady(false);
        continueAfterInterstitial();
        reloadInterstitial();
      }),
      interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
        interstitialReadyRef.current = false;
        setInterstitialReady(false);
        continueAfterInterstitial();
        reloadInterstitial(12000);
      }),
      rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => setRewardedAdReady(true)),
      rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        rewardedEarned.current = true;
        setRewardDoubled(true);
        notify("Ödülün 2× oldu");
      }),
      rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        const earned = rewardedEarned.current;
        const wasRequested = rewardedRequested.current;
        rewardedEarned.current = false;
        rewardedRequested.current = false;
        setAdLoading(false);
        setRewardedAdReady(false);
        if (wasRequested && !earned) notify("Ödül için reklamı tamamlamalısın");
        reloadRewarded();
      }),
      rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
        rewardedRequested.current = false;
        setAdLoading(false);
        setRewardedAdReady(false);
        reloadRewarded(12000);
      }),
    ];
    (async () => {
      try {
        const consent = await AdsConsent.gatherConsent({ tagForUnderAgeOfConsent: false });
        if (!active || !consent.canRequestAds) return;
        await mobileAds().initialize();
        if (!active) return;
        interstitialAd.load();
        rewardedAd.load();
      } catch {
        // Consent or network errors must never prevent the game from opening.
      }
    })();
    return () => {
      active = false;
      subscriptions.forEach((unsubscribe) => unsubscribe());
      if (interstitialRetry) clearTimeout(interstitialRetry);
      if (rewardedRetry) clearTimeout(rewardedRetry);
      clearInterstitialWait();
    };
  }, []);
  useEffect(() => () => {
    if (autoOpenTimer.current) clearTimeout(autoOpenTimer.current);
  }, []);

  function tap() {
    if (save.settings.haptics && Platform.OS !== "web") Haptics.selectionAsync();
  }

  async function playSfx(player: any) {
    if (!save.settings.sfx) return;
    try {
      if (!player?.isLoaded) return;
      if (player.playing) player.pause();
      await player.seekTo(0);
      if (!player?.isLoaded) return;
      player.play();
    } catch {
      // A sound should never block gameplay if the native player is not ready.
    }
  }

  function navigate(next: Screen) {
    tap();
    if (autoOpenTimer.current) {
      clearTimeout(autoOpenTimer.current);
      autoOpenTimer.current = null;
    }
    slideProgress.stopAnimation();
    slideProgress.setValue(0);
    completionProgress.stopAnimation();
    completionProgress.setValue(0);
    setActiveMove(null);
    setAnimatingMove(false);
    setLevelCompleting(false);
    rewardAcceptingRef.current = false;
    setRewardAccepting(false);
    playSfx(transitionSound);
    if (next === "home") {
      homeEntrance.setValue(0);
      setScreen(next);
      requestAnimationFrame(() => Animated.timing(homeEntrance, {
        toValue: 1, duration: 620, easing: Easing.bezier(.2, .9, .25, 1), useNativeDriver: true,
      }).start());
    } else if (next === "levels") {
      levelsEntrance.setValue(0);
      setScreen(next);
      requestAnimationFrame(() => Animated.timing(levelsEntrance, {
        toValue: 1, duration: 520, easing: Easing.bezier(.2, .9, .25, 1), useNativeDriver: true,
      }).start());
    } else if (next === "game") {
      gameEntrance.setValue(0);
      setScreen(next);
      resetBoard();
      requestAnimationFrame(() => Animated.timing(gameEntrance, {
        toValue: 1, duration: 620, easing: Easing.bezier(.2, .9, .25, 1), useNativeDriver: true,
      }).start());
    } else {
      setScreen(next);
    }
  }

  function openLevel(level: number, allowNewlyUnlocked = false) {
    if (!allowNewlyUnlocked && !levelIsUnlocked(save, level)) {
      playSfx(buttonSound);
      notify("Bu bölüm henüz kilitli");
      return;
    }
    tap();
    if (autoOpenTimer.current) {
      clearTimeout(autoOpenTimer.current);
      autoOpenTimer.current = null;
    }
    const data = createLevel(level);
    slideProgress.stopAnimation();
    slideProgress.setValue(0);
    completionProgress.stopAnimation();
    completionProgress.setValue(0);
    setActiveMove(null);
    setAnimatingMove(false);
    setLevelCompleting(false);
    rewardAcceptingRef.current = false;
    setRewardAccepting(false);
    setSave((old) => ({ ...old, currentLevel: level }));
    setBoard(data.board);
    solutionPath.current = simplifyMovePath(data.target, data.scramble, data.rows, data.cols);
    setMoves(0);
    gameEntrance.setValue(0);
    playSfx(transitionSound);
    setScreen("game");
    requestAnimationFrame(() => Animated.timing(gameEntrance, {
      toValue: 1, duration: 620, easing: Easing.bezier(.2, .9, .25, 1), useNativeDriver: true,
    }).start());
  }

  function transitionToLevel(level: number) {
    setTransitioningToLevel(level);
    levelTransitionProgress.stopAnimation();
    levelTransitionProgress.setValue(0);
    Animated.timing(levelTransitionProgress, {
      toValue: 1,
      duration: 420,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    }).start(({ finished }) => {
      if (!finished) return;
      openLevel(level, true);
      Animated.timing(levelTransitionProgress, {
        toValue: 2,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
        isInteraction: false,
      }).start(() => {
        setTransitioningToLevel(null);
        levelTransitionProgress.setValue(0);
      });
    });
  }

  function requestLayerUnlock(layerId: number) {
    const layer = LEVEL_LAYERS[layerId - 1];
    if (!layer || layerId === 1 || save.unlockedLayers.includes(layerId)) return;
    const previousLayer = LEVEL_LAYERS[layerId - 2];
    if (!previousLayer || !save.unlockedLayers.includes(previousLayer.id)) {
      notify(`Önce ${previousLayer?.shortName ?? "önceki"} katmanını açmalısın`);
      return;
    }
    if (save.layerStones < LAYER_UNLOCK_COST) {
      setInsufficientLayerId(layerId);
      return;
    }
    setPendingLayerUnlock(layerId);
  }

  function confirmLayerUnlock() {
    if (pendingLayerUnlock === null) return;
    const layer = LEVEL_LAYERS[pendingLayerUnlock - 1];
    const previousLayer = LEVEL_LAYERS[pendingLayerUnlock - 2];
    if (!layer || !previousLayer) {
      setPendingLayerUnlock(null);
      return;
    }
    setSave((old) => {
      if (
        old.unlockedLayers.includes(layer.id)
        || !old.unlockedLayers.includes(previousLayer.id)
        || old.layerStones < LAYER_UNLOCK_COST
      ) return old;
      return {
        ...old,
        layerStones: old.layerStones - LAYER_UNLOCK_COST,
        unlockedLayers: [...old.unlockedLayers, layer.id].sort((a, b) => a - b),
        currentLevel: layer.start,
      };
    });
    setPendingLayerUnlock(null);
    playSfx(rewardSound);
    setCelebratingLayerId(layer.id);
    setScreen("layerUnlocked");
  }

  function nextLayerAfterCompletedLayer(level: number) {
    const info = levelInfo(level);
    if (info.layer.id === 0 || level !== info.layer.end) return null;
    return LEVEL_LAYERS.find((layer) => layer.id === info.layer.id + 1) ?? null;
  }

  function resetBoard() {
    const data = createLevel(save.currentLevel);
    slideProgress.stopAnimation();
    slideProgress.setValue(0);
    setActiveMove(null);
    setAnimatingMove(false);
    setLevelCompleting(false);
    setBoard(data.board);
    solutionPath.current = simplifyMovePath(data.target, data.scramble, data.rows, data.cols);
    setMoves(0);
  }

  function perform(move: Move, initialProgress = 0, pathMode: "append" | "pop" = "append") {
    if (animatingMove || levelCompleting) return;
    tap();
    playSfx(slideSound);
    const next = shift(board, levelData.rows, levelData.cols, move);
    const nextMoves = moves + 1;
    const targetProgress = move.amount ?? 1;
    setActiveMove(move);
    setAnimatingMove(true);
    slideProgress.setValue(initialProgress);
    const remainingDistance = Math.abs(targetProgress - initialProgress);
    Animated.timing(slideProgress, {
      toValue: targetProgress,
      duration: Math.min(600, 180 + 320 * remainingDistance),
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
      isInteraction: false,
    }).start(({ finished }) => {
      if (!finished) return;
      requestAnimationFrame(() => {
        const solved = next.every((value, index) => value === levelData.target[index]);
        setBoard(next);
        setMoves(nextMoves);
        solutionPath.current = pathMode === "pop"
          ? solutionPath.current.slice(0, -1)
          : simplifyMovePath(
            levelData.target,
            [...solutionPath.current, move],
            levelData.rows,
            levelData.cols,
          );
        setActiveMove(null);
        slideProgress.setValue(0);
        setAnimatingMove(false);
        playSfx(settleSound);
        if (!solved) return;
        const best = save.bestMoves[String(save.currentLevel)];
        const earnedStars = levelStarScore(nextMoves, idealMoves);
        setSave((old) => ({
          ...old,
          bestMoves: { ...old.bestMoves, [String(old.currentLevel)]: best ? Math.min(best, nextMoves) : nextMoves },
          stars: {
            ...old.stars,
            [String(old.currentLevel)]: Math.max(old.stars[String(old.currentLevel)] ?? 0, earnedStars),
          },
        }));
        setLevelCompleting(true);
        completionProgress.setValue(0);
        playSfx(completeSound);
        Animated.timing(completionProgress, {
          toValue: 1,
          duration: 1550,
          easing: Easing.linear,
          useNativeDriver: true,
          isInteraction: false,
        }).start(({ finished: completionFinished }) => {
          if (!completionFinished) return;
          setLevelCompleting(false);
          setRewardDoubled(false);
          rewardAcceptingRef.current = false;
          setRewardAccepting(false);
          playSfx(rewardSound);
          setScreen("reward");
        });
      });
    });
  }

  function useHint(animate?: (duration: number) => void) {
    if (animatingMove || levelCompleting) return;
    const lastMove = solutionPath.current[solutionPath.current.length - 1];
    if (!lastMove) {
      notify("Bu bölüm zaten çözüm yolunun sonunda");
      return;
    }
    const hintMove = inverseMove(lastMove);
    const duration = Math.min(600, 180 + 320 * (hintMove.amount ?? 1));
    const executeHint = () => {
      playSfx(hintSound);
      animate?.(duration);
      perform(hintMove, 0, "pop");
    };
    if (save.freeHints > 0) {
      setSave((old) => ({ ...old, freeHints: old.freeHints - 1 }));
      executeHint();
      return;
    }
    if (save.hintLeaves < 3) {
      notify("İpucu yaprağın kalmadı");
      setSheet("shop");
      return;
    }
    const usePaidHint = () => {
      setSave((old) => ({ ...old, hintLeaves: old.hintLeaves - 3 }));
      executeHint();
    };
    if (!save.paidHintNoticeSeen) {
      pendingPaidHint.current = {
        move: hintMove,
        duration,
        animate,
      };
      setHintConfirmVisible(true);
      return;
    }
    usePaidHint();
  }

  function closeHintConfirm() {
    pendingPaidHint.current = null;
    setHintConfirmVisible(false);
  }

  function confirmPaidHint() {
    const pending = pendingPaidHint.current;
    if (!pending) return;
    pendingPaidHint.current = null;
    setHintConfirmVisible(false);
    if (save.hintLeaves < 3) {
      notify("İpucu yaprağın kalmadı");
      setSheet("shop");
      return;
    }
    setSave((old) => ({
      ...old,
      paidHintNoticeSeen: true,
      hintLeaves: old.hintLeaves - 3,
    }));
    playSfx(hintSound);
    pending.animate?.(pending.duration);
    perform(pending.move, 0, "pop");
  }

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 1700);
  }

  function maybeAskForReview(level: number) {
    if (Platform.OS !== "ios" || save.reviewPromptDismissed || save.reviewPromptCount >= 3) return false;
    if (level <= PRACTICE_LEVELS || level % 12 !== 0) return false;
    if (level - save.lastReviewPromptLevel < 12) return false;
    setSave((old) => ({
      ...old,
      reviewPromptCount: old.reviewPromptCount + 1,
      lastReviewPromptLevel: level,
    }));
    setReviewPromptVisible(true);
    return true;
  }

  function acceptReward(destination: "levels" | "home" = "levels") {
    if (rewardAcceptingRef.current) return;
    rewardAcceptingRef.current = true;
    setRewardAccepting(true);
    const level = save.currentLevel;
    const info = levelInfo(level);
    const nextLevel = Math.min(TOTAL_LEVELS, level + 1);
    const currentLayerId = info.layer.id;
    const nextLayerId = levelInfo(nextLevel).layer.id;
    const nextLayerToUnlock = nextLayerAfterCompletedLayer(level);
    const isPractice = info.layer.id === 0;
    const canAdvance = nextLevel > level
      && (nextLayerId === currentLayerId || save.unlockedLayers.includes(nextLayerId));
    const first = !save.rewarded.includes(level);
    const multiplier = rewardDoubled ? 2 : 1;
    const earnedStones = first && !isPractice ? 1 * multiplier : 0;
    const earnedLeaves = first && !isPractice ? 3 * multiplier : 0;
    setSave((old) => {
      if (!first) return { ...old, currentLevel: isPractice || canAdvance ? nextLevel : level };
      return {
        ...old,
        completed: old.completed.includes(level) ? old.completed : [...old.completed, level],
        rewarded: [...old.rewarded, level],
        hintLeaves: old.hintLeaves + earnedLeaves,
        layerStones: old.layerStones + earnedStones,
        currentLevel: isPractice || canAdvance ? nextLevel : level,
        tutorialCompleted: isPractice && level === PRACTICE_LEVELS ? true : old.tutorialCompleted,
      };
    });
    const continueToNextScreen = () => {
      let reviewPromptOpened = false;
      playSfx(transitionSound);
      if (destination === "home") {
        homeEntrance.setValue(0);
        setScreen("home");
        requestAnimationFrame(() => Animated.timing(homeEntrance, {
          toValue: 1, duration: 620, easing: Easing.bezier(.2, .9, .25, 1), useNativeDriver: true,
        }).start());
        return;
      }
      if (isPractice) {
        if (level === PRACTICE_LEVELS) {
          playSfx(rewardSound);
          setScreen("practiceComplete");
        } else {
          transitionToLevel(nextLevel);
        }
        return;
      }
      if (
        destination === "levels"
        && nextLayerToUnlock
        && !save.unlockedLayers.includes(nextLayerToUnlock.id)
      ) {
        const stonesAfterReward = save.layerStones + earnedStones;
        if (stonesAfterReward >= LAYER_UNLOCK_COST) {
          setPendingLayerUnlock(nextLayerToUnlock.id);
        } else {
          setInsufficientLayerId(nextLayerToUnlock.id);
        }
        return;
      }
      levelsEntrance.setValue(0);
      setScreen("levels");
      if (destination === "levels" && first) {
        reviewPromptOpened = maybeAskForReview(level);
      }
      requestAnimationFrame(() => {
        Animated.timing(levelsEntrance, {
          toValue: 1, duration: 620, easing: Easing.bezier(.2, .9, .25, 1),
          useNativeDriver: true,
        }).start();
      });
      if (canAdvance && !reviewPromptOpened) {
        autoOpenTimer.current = setTimeout(() => {
          autoOpenTimer.current = null;
          setToast("");
          transitionToLevel(nextLevel);
        }, 680);
      }
    };
    const shouldAttemptInterstitial = !save.adsRemoved
      && destination === "levels"
      && info.layer.id > 0
      && level >= 12
      && info.localLevel % 3 === 0;
    if (!shouldAttemptInterstitial || !ADS_AVAILABLE) {
      continueToNextScreen();
      return;
    }
    interstitialContinuation.current = continueToNextScreen;
    pendingInterstitialShow.current = true;
    if (interstitialReady || interstitialReadyRef.current) {
      showLoadedInterstitial();
      return;
    }
    interstitialAd.load();
    clearInterstitialWait();
    interstitialWaitTimer.current = setTimeout(() => {
      if (!pendingInterstitialShow.current) return;
      continueAfterInterstitial();
      interstitialAd.load();
    }, 1600);
  }

  function showRewardedAd() {
    if (rewardDoubled || adLoading) return;
    if (!ADS_AVAILABLE) {
      notify("Reklamlar bu test ortamında çalışmaz");
      return;
    }
    if (!rewardedAdReady) {
      notify("Reklam hazırlanıyor, biraz sonra tekrar dene");
      rewardedAd.load();
      return;
    }
    rewardedEarned.current = false;
    rewardedRequested.current = true;
    setAdLoading(true);
    setRewardedAdReady(false);
    rewardedAd.show().catch(() => {
      rewardedRequested.current = false;
      setAdLoading(false);
      notify("Reklam açılamadı, lütfen tekrar dene");
      rewardedAd.load();
    });
  }

  function finishOnboarding() {
    if (reviewingOnboarding) {
      setReviewingOnboarding(false);
      homeEntrance.setValue(0);
      playSfx(transitionSound);
      setScreen("home");
      requestAnimationFrame(() => Animated.timing(homeEntrance, {
        toValue: 1,
        duration: 720,
        easing: Easing.bezier(.2, .9, .25, 1),
        useNativeDriver: true,
      }).start());
      return;
    }
    setSave((old) => ({ ...old, onboardingSeen: true, currentLevel: old.tutorialCompleted ? old.currentLevel : 1 }));
    if (!save.tutorialCompleted) {
      transitionToLevel(1);
      return;
    }
    homeEntrance.setValue(0);
    playSfx(transitionSound);
    setScreen("home");
    requestAnimationFrame(() => Animated.timing(homeEntrance, {
      toValue: 1,
      duration: 720,
      easing: Easing.bezier(.2, .9, .25, 1),
      useNativeDriver: true,
    }).start());
  }

  function selectLanguage(language: Language) {
    playSfx(buttonSound);
    setSave((old) => ({
      ...old,
      languageChosen: true,
      settings: { ...old.settings, language },
    }));
    setScreen("onboarding");
  }

  function closeReviewPrompt(dismissed = false) {
    setReviewPromptVisible(false);
    if (!dismissed) return;
    setSave((old) => ({ ...old, reviewPromptDismissed: true }));
  }

  async function rateApp() {
    closeReviewPrompt(true);
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      }
    } catch {
      // StoreReview is system-controlled; if it refuses, continue silently.
    }
  }

  function closeUpdatePrompt(openStore = false) {
    const promptedVersion = updatePromptVersion;
    setUpdatePromptVersion("");
    if (promptedVersion) {
      setSave((old) => ({ ...old, lastUpdatePromptVersion: promptedVersion }));
    }
    if (openStore) openAppStore();
  }

  if (screen === "splash") return <LanguageContext.Provider value={save.settings.language}>
  <ImageBackground source={BOTANICAL_BACKGROUND} style={styles.background} resizeMode="cover">
    <SafeAreaView style={styles.transparentRoot}>
      <StatusBar style="dark" />
      <Animated.View style={[styles.splash, { opacity: fade, transform: [{ scale: fade.interpolate({ inputRange: [0, 1], outputRange: [.7, 1] }) }] }]}>
        <Image source={APP_ICON} style={styles.splashLogo} resizeMode="cover" />
        <Text style={styles.logoTitle}>Petal Shift</Text><Text style={styles.subtitle}>Her esinti yeni bir yol açar</Text>
      </Animated.View>
    </SafeAreaView>
  </ImageBackground>
  </LanguageContext.Provider>;

  return <LanguageContext.Provider value={save.settings.language}>
  <UiSoundContext.Provider value={() => playSfx(buttonSound)}>
  <ImageBackground source={BOTANICAL_BACKGROUND} style={styles.background} resizeMode="cover">
    <View pointerEvents="none" style={styles.backgroundWash} />
    <SafeAreaView style={styles.transparentRoot}>
      <StatusBar style="dark" />
      {screen === "language" && <LanguageSelection select={selectLanguage} />}
      {screen === "onboarding" && <Onboarding finish={finishOnboarding} />}
      {screen === "practiceComplete" && <PracticeComplete next={() => transitionToLevel(PRACTICE_LEVELS + 1)} />}
      {screen === "layerUnlocked" && celebratingLayerId !== null && <LayerUnlockedCelebration
        layer={LEVEL_LAYERS[celebratingLayerId - 1]}
        next={() => {
          const layer = LEVEL_LAYERS[celebratingLayerId - 1];
          setCelebratingLayerId(null);
          transitionToLevel(layer.start);
        }} />}
      {screen === "home" && <Home save={save} go={navigate} open={setSheet} entrance={homeEntrance} />}
      {screen === "levels" && <Levels save={save} go={navigate} choose={openLevel}
        unlockLayer={requestLayerUnlock} openShop={() => setSheet("shop")} entrance={levelsEntrance} />}
      {screen === "game" && <Animated.View style={[
        styles.gameContainer,
        {
          opacity: gameEntrance,
          transform: [
            { translateY: gameEntrance.interpolate({ inputRange: [0, 1], outputRange: [34, 0] }) },
            { scale: gameEntrance.interpolate({ inputRange: [0, 1], outputRange: [.96, 1] }) },
          ],
        },
      ]}><Game save={save} board={board.length ? board : levelData.board}
          rows={levelData.rows} cols={levelData.cols} target={levelData.target}
          moves={moves} move={perform} activeMove={activeMove} slideProgress={slideProgress}
           animating={animatingMove || levelCompleting} completing={levelCompleting}
           completionProgress={completionProgress}
           dragSfx={() => playSfx(dragSound)}
           back={() => navigate("levels")} home={() => navigate("home")} openShop={() => setSheet("shop")}
           hint={useHint} reset={() => setSheet("reset")} />
      </Animated.View>}
      {screen === "reward" && <Reward save={save} moves={moves} idealMoves={idealMoves} doubled={rewardDoubled} adLoading={adLoading}
        accepting={rewardAccepting}
        doubleReward={showRewardedAd} next={acceptReward} home={() => acceptReward("home")} />}
      <GameSheet kind={sheet} save={save} close={() => setSheet(null)} update={setSave}
        confirmReset={() => { resetBoard(); setSheet(null); }}
        reviewOnboarding={() => {
          setSheet(null);
          setReviewingOnboarding(true);
          setScreen("onboarding");
        }} />
      <HintConfirmModal visible={hintConfirmVisible} leaves={save.hintLeaves}
        cancel={closeHintConfirm} confirm={confirmPaidHint} />
      <LayerUnlockModal layerId={pendingLayerUnlock} stones={save.layerStones}
        cancel={() => {
          rewardAcceptingRef.current = false;
          setRewardAccepting(false);
          setPendingLayerUnlock(null);
        }} confirm={confirmLayerUnlock} />
      <InsufficientStoneModal layerId={insufficientLayerId} stones={save.layerStones}
        cancel={() => {
          rewardAcceptingRef.current = false;
          setRewardAccepting(false);
          setInsufficientLayerId(null);
        }} openShop={() => {
          rewardAcceptingRef.current = false;
          setRewardAccepting(false);
          setInsufficientLayerId(null);
          setSheet("shop");
        }} />
      <ReviewPromptModal visible={reviewPromptVisible} cancel={() => closeReviewPrompt(false)} confirm={rateApp} />
      <UpdatePromptModal version={updatePromptVersion} cancel={() => closeUpdatePrompt(false)}
        confirm={() => closeUpdatePrompt(true)} />
      {transitioningToLevel !== null && <LevelTransitionOverlay
        level={transitioningToLevel} progress={levelTransitionProgress} />}
      {!!toast && <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>}
    </SafeAreaView>
  </ImageBackground>
  </UiSoundContext.Provider>
  </LanguageContext.Provider>;
}

const ONBOARDING_STEP_COUNT = 5;

function LanguageSelection({ select }: { select: (language: Language) => void }) {
  return <View style={styles.languageScreen}>
    <View style={styles.languageCard}>
      <Image source={APP_ICON} style={styles.languageLogo} resizeMode="cover" />
      <NativeText style={styles.languageBrand}>PETAL SHIFT</NativeText>
      <NativeText style={styles.languageTitle}>Dilini seç</NativeText>
      <NativeText style={styles.languageSubtitle}>Choose your language</NativeText>
      <Pressable onPress={() => select("tr")} style={({ pressed }) => [styles.languageButton, pressed && styles.pressed]}>
        <View style={styles.languageCode}><NativeText style={styles.languageCodeText}>TR</NativeText></View>
        <View style={styles.languageButtonCopy}>
          <NativeText style={styles.languageButtonTitle}>Türkçe</NativeText>
          <NativeText style={styles.languageButtonSub}>Oyuna Türkçe devam et</NativeText>
        </View>
        <NativeText style={styles.languageArrow}>›</NativeText>
      </Pressable>
      <Pressable onPress={() => select("en")} style={({ pressed }) => [styles.languageButton, pressed && styles.pressed]}>
        <View style={[styles.languageCode, styles.languageCodeEnglish]}><NativeText style={styles.languageCodeText}>EN</NativeText></View>
        <View style={styles.languageButtonCopy}>
          <NativeText style={styles.languageButtonTitle}>English</NativeText>
          <NativeText style={styles.languageButtonSub}>Continue in English</NativeText>
        </View>
        <NativeText style={styles.languageArrow}>›</NativeText>
      </Pressable>
      <NativeText style={styles.languageNote}>Dili daha sonra ayarlardan değiştirebilirsin.</NativeText>
      <NativeText style={styles.languageNoteEnglish}>You can change this later in Settings.</NativeText>
    </View>
  </View>;
}

function PracticeComplete({ next }: { next: () => void }) {
  const entrance = useRef(new Animated.Value(0)).current;
  const started = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const begin = () => {
    if (started.current) return;
    started.current = true;
    if (timer.current) clearTimeout(timer.current);
    next();
  };
  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      speed: 7,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
    timer.current = setTimeout(begin, 4200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);
  const scale = entrance.interpolate({ inputRange: [0, 1], outputRange: [.72, 1] });
  const preview = [0, 2, 0, 2, 0, 2, 0, 2, 0];
  return <View style={styles.practiceCompleteScreen}>
    <Animated.View style={[styles.practiceCompleteCard, { opacity: entrance, transform: [{ scale }] }]}>
      <Text style={styles.practiceCompleteKicker}>3/3 ALIŞTIRMA TAMAMLANDI</Text>
      <Text style={styles.practiceCompleteTitle}>Gerçek eğlence şimdi başlıyor!</Text>
      <Text style={styles.practiceCompleteCopy}>2×3 eğitim bahçesini tamamladın. Şimdi daha büyük tahtalar, daha uzun kaydırmalar ve gerçek bulmacalar başlıyor.</Text>
      <View style={styles.practiceRoute}>
        <Text style={styles.practiceRouteDone}>2×3  ✓ ALIŞTIRMA</Text>
        <Text style={styles.practiceRouteArrow}>→</Text>
        <Text style={styles.practiceRouteNext}>3×3  FİLİZ</Text>
      </View>
      <View style={styles.practiceCompleteGrid}>{preview.map((color, index) =>
        <ImageBackground key={index} source={SOIL_ASSETS[color]} style={styles.practiceCompleteCell} imageStyle={styles.practiceCompleteCellImage}>
          <Image source={FLOWER_ASSETS[color]} style={styles.practiceCompleteFlower} resizeMode="contain" />
        </ImageBackground>)}</View>
      <View style={styles.practiceCompletePill}><Text style={styles.practiceCompletePillText}>FİLİZ AVLUSU · 3×3 · 2 RENK</Text></View>
      <TButton title="3×3 İLK BÖLÜME BAŞLA" onPress={begin} />
      <Text style={styles.practiceCompleteAuto}>Birkaç saniye sonra otomatik başlayacak</Text>
    </Animated.View>
  </View>;
}

function LayerUnlockedCelebration({ layer, next }: { layer: LayerConfig; next: () => void }) {
  const entrance = useRef(new Animated.Value(0)).current;
  const started = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const begin = () => {
    if (started.current) return;
    started.current = true;
    if (timer.current) clearTimeout(timer.current);
    next();
  };
  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      speed: 6,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
    timer.current = setTimeout(begin, 4200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);
  const cardScale = entrance.interpolate({ inputRange: [0, 1], outputRange: [.7, 1] });
  const artScale = entrance.interpolate({ inputRange: [0, .7, 1], outputRange: [.45, 1.08, 1] });
  return <View style={styles.layerCelebrationScreen}>
    <Animated.View style={[styles.layerCelebrationCard, { opacity: entrance, transform: [{ scale: cardScale }] }]}>
      <Text style={styles.layerCelebrationKicker}>YENİ KATMAN AÇILDI</Text>
      <Text style={styles.layerCelebrationTitle}>Tebrikler!</Text>
      <Animated.View style={[styles.layerCelebrationArt, { transform: [{ scale: artScale }] }]}>
        <Image source={UI.chapterCard} style={styles.layerCelebrationFrame} resizeMode="stretch" />
        <Image source={UI.gate} style={styles.layerCelebrationGate} resizeMode="contain" />
        {[0, 1, 2, 3].map((index) => <View key={index} style={[
          styles.layerCelebrationSpark,
          { transform: [{ rotate: `${index * 45}deg` }, { translateY: -105 }] },
        ]}><Text style={styles.layerCelebrationSparkText}>✦</Text></View>)}
      </Animated.View>
      <Text style={styles.layerCelebrationName}>{layer.name}</Text>
      <View style={styles.layerCelebrationPill}>
        <Text style={styles.layerCelebrationPillText}>{layerSizeLabel(layer)} · {layerLevelCount(layer)} YENİ BÖLÜM</Text>
      </View>
      <Text style={styles.layerCelebrationCopy}>Yeni bahçenin ilk bölümü birazdan açılacak.</Text>
      <TButton title="İLK BÖLÜME BAŞLA" onPress={begin} />
    </Animated.View>
  </View>;
}

function Onboarding({ finish }: { finish: () => void }) {
  const sound = React.useContext(UiSoundContext);
  const [step, setStep] = useState(0);
  const pageIn = useRef(new Animated.Value(0)).current;
  const demoProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(pageIn, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    demoProgress.stopAnimation();
    demoProgress.setValue(0);
    if (step !== 2 && step !== 3) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(450),
      Animated.timing(demoProgress, {
        toValue: 1,
        duration: 1550,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
        isInteraction: false,
      }),
      Animated.delay(700),
      Animated.timing(demoProgress, {
        toValue: 0,
        duration: 1550,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
        isInteraction: false,
      }),
      Animated.delay(700),
    ]));
    loop.start();
    return () => loop.stop();
  }, [step, demoProgress]);

  const changeStep = (next: number) => {
    Animated.timing(pageIn, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(next);
      pageIn.setValue(0);
      Animated.timing(pageIn, {
        toValue: 1,
        duration: 390,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const pageX = pageIn.interpolate({ inputRange: [0, 1], outputRange: [28, 0] });
  return <View style={styles.onboardingScreen}>
    <View style={styles.onboardingTop}>
      <View>
        <Text style={styles.onboardingBrand}>PETAL SHIFT</Text>
        <Text style={styles.onboardingStepText}>NASIL OYNANIR · {step + 1}/{ONBOARDING_STEP_COUNT}</Text>
      </View>
      <Pressable onPress={() => { sound(); finish(); }} hitSlop={10} style={({ pressed }) => [styles.onboardingSkip, pressed && styles.pressed]}>
        <Text style={styles.onboardingSkipText}>ATLA</Text>
      </Pressable>
    </View>

    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.onboardingScroll}>
      <Animated.View style={[styles.onboardingPage, { opacity: pageIn, transform: [{ translateX: pageX }] }]}>
        {step === 0 && <>
          <Image source={APP_ICON} style={styles.onboardingLogo} resizeMode="cover" />
          <Text style={styles.onboardingTitle}>Bahçeyi uyandır</Text>
          <Text style={styles.onboardingCopy}>
            Çiçekleri tek tek değil, bütün bir satırı veya sütunu kaydırarak arka plandaki renk düzeniyle eşleştir.
          </Text>
          <View style={styles.onboardingRules}>
            <OnboardingRule number="1" title="Bir sıra seç" copy="Parmağını bir çiçeğin üzerine koy." />
            <OnboardingRule number="2" title="Düz yönde sürükle" copy="Sağa, sola, yukarı veya aşağı hareket et." />
            <OnboardingRule number="3" title="Renkleri eşleştir" copy="Her çiçeği kendi rengindeki zemine getir." />
          </View>
        </>}

        {step === 1 && <>
          <Text style={styles.onboardingKicker}>HEDEFİ OKU</Text>
          <Text style={styles.onboardingTitle}>Arka plan renkleri hedefindir</Text>
          <Text style={styles.onboardingCopy}>
            Her karenin zemini, oraya gelmesi gereken çiçeğin rengini gösterir. Yeşil zemine yeşil, sarı zemine sarı çiçek gelmelidir.
          </Text>
          <TargetColorDemo />
          <View style={styles.onboardingCallout}>
            <Text style={styles.onboardingCalloutTitle}>Önemli</Text>
            <Text style={styles.onboardingCalloutText}>Zeminler hareket etmez. Sadece üzerlerindeki çiçekler kayar.</Text>
          </View>
        </>}

        {step === 2 && <>
          <Text style={styles.onboardingKicker}>YATAY HAREKET</Text>
          <Text style={styles.onboardingTitle}>Satır, halka gibi döner</Text>
          <Text style={styles.onboardingCopy}>
            Satırı sağa sürüklediğinde bütün çiçekler sağa gider. En sağdaki çiçek kaybolmaz; aynı satırın en solundan geri gelir.
          </Text>
          <WrapDemo direction="horizontal" progress={demoProgress} />
          <View style={styles.onboardingFormula}><Text style={styles.onboardingFormulaText}>EN SAĞDAKİ  →  EN SOLA</Text></View>
          <Text style={styles.onboardingFinePrint}>Sola sürüklersen bunun tam tersi olur: en soldaki çiçek en sağdan geri gelir.</Text>
        </>}

        {step === 3 && <>
          <Text style={styles.onboardingKicker}>DİKEY HAREKET</Text>
          <Text style={styles.onboardingTitle}>Sütun da aynı şekilde döner</Text>
          <Text style={styles.onboardingCopy}>
            Sütunu aşağı sürüklediğinde bütün çiçekler aşağı iner. En alttaki çiçek aynı sütunun en üstünden geri gelir.
          </Text>
          <WrapDemo direction="vertical" progress={demoProgress} />
          <View style={styles.onboardingFormula}><Text style={styles.onboardingFormulaText}>EN ALTTAKİ  ↓  EN ÜSTE</Text></View>
          <Text style={styles.onboardingFinePrint}>Yukarı sürüklersen en üstteki çiçek en alttan geri gelir.</Text>
        </>}

        {step === 4 && <>
          <Text style={styles.onboardingKicker}>BÖLÜMÜ TAMAMLA</Text>
          <Text style={styles.onboardingTitle}>Bütün renkler eşleşince kazanırsın</Text>
          <Text style={styles.onboardingCopy}>
            Her çiçek kendi rengindeki zeminin üzerindeyse bahçe tamamlanır. Uzak bir sırayı birden fazla kare sürükleyebilirsin.
          </Text>
          <SolvedGardenDemo />
          <View style={styles.onboardingChecklist}>
            <Text style={styles.onboardingChecklistText}>✓ Bir çiçeği değil, tüm sırayı hareket ettirirsin.</Text>
            <Text style={styles.onboardingChecklistText}>✓ İlk 3 ipucun ücretsizdir.</Text>
            <Text style={styles.onboardingChecklistText}>✓ Takılırsan ampul düğmesi doğru hamleyi gösterir.</Text>
          </View>
        </>}
      </Animated.View>
    </ScrollView>

    <View style={styles.onboardingFooter}>
      <View style={styles.onboardingDots}>
        {Array.from({ length: ONBOARDING_STEP_COUNT }, (_, index) =>
          <View key={index} style={[styles.onboardingDot, index === step && styles.onboardingDotActive]} />)}
      </View>
      <View style={styles.onboardingButtons}>
        {step > 0 && <View style={styles.onboardingBackButton}><TButton title="GERİ" secondary onPress={() => changeStep(step - 1)} /></View>}
        <View style={{ flex: 1 }}><TButton
          title={step === ONBOARDING_STEP_COUNT - 1 ? "OYUNA BAŞLA" : "DEVAM ET"}
          onPress={() => step === ONBOARDING_STEP_COUNT - 1 ? finish() : changeStep(step + 1)}
        /></View>
      </View>
    </View>
  </View>;
}

function OnboardingRule({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <View style={styles.onboardingRule}>
    <View style={styles.onboardingRuleNumber}><Text style={styles.onboardingRuleNumberText}>{number}</Text></View>
    <View style={{ flex: 1 }}><Text style={styles.onboardingRuleTitle}>{title}</Text><Text style={styles.onboardingRuleCopy}>{copy}</Text></View>
  </View>;
}

function TargetColorDemo() {
  const cells = [
    { soil: 0, flower: 0, correct: true, show: true },
    { soil: 2, flower: 0, correct: false, show: true },
    { soil: 0, flower: 0, correct: true },
    { soil: 2, flower: 2, correct: true },
    { soil: 0, flower: 0, correct: true },
    { soil: 2, flower: 2, correct: true },
    { soil: 0, flower: 0, correct: true },
    { soil: 2, flower: 2, correct: true },
    { soil: 0, flower: 0, correct: true },
  ];
  return <View style={styles.targetDemo}>
    <View style={styles.targetDemoGrid}>{cells.map((cell, index) => <ImageBackground key={index} source={SOIL_ASSETS[cell.soil]}
        imageStyle={styles.targetDemoImage} style={[styles.targetDemoCell, { backgroundColor: ONBOARDING_SOIL_COLORS[cell.soil] }]}>
        <Image source={FLOWER_ASSETS[cell.flower]} style={styles.targetDemoFlower} resizeMode="contain" />
        {cell.show && <View style={[styles.targetDemoState, cell.correct ? styles.targetDemoCorrect : styles.targetDemoWrong]}>
          <Text style={styles.targetDemoStateText}>{cell.correct ? "✓" : "≠"}</Text>
        </View>}
      </ImageBackground>)}</View>
    <View style={styles.targetDemoLegend}>
      <Text style={styles.targetDemoLegendGood}>✓ Aynı renk: doğru</Text>
      <Text style={styles.targetDemoLegendBad}>≠ Farklı renk: değiştir</Text>
    </View>
  </View>;
}

function WrapDemo({ direction, progress }: { direction: "horizontal" | "vertical"; progress: Animated.Value }) {
  const tile = 58;
  const gap = 4;
  const padding = 6;
  const pitch = tile + gap;
  const boardSize = padding * 2 + tile * 3 + gap * 2 + 8;
  const horizontal = direction === "horizontal";
  const travel = progress.interpolate({ inputRange: [0, .16, .84, 1], outputRange: [0, 0, pitch, pitch] });
  const soils = [0, 2, 0, 2, 0, 2, 0, 2, 0];
  const flowers = [0, 2, 0, 2, 0, 2, 0, 2, 0];
  const activeIndexes = horizontal ? [3, 4, 5] : [1, 4, 7];
  const activeColors = activeIndexes.map((index) => flowers[index]);
  const sequence = [activeColors[2], ...activeColors];
  return <View style={styles.wrapDemoArea}>
    <Text style={styles.wrapDemoArrow}>{horizontal
      ? "SAĞA  →   ·   ←  SOLA GERİ"
      : "AŞAĞI  ↓   ·   ↑  YUKARI GERİ"}</Text>
    <View style={[styles.wrapDemoTrack, { width: boardSize, height: boardSize }]}>
      {soils.map((color, index) => {
        const row = Math.floor(index / 3), col = index % 3;
        return <ImageBackground key={`soil-${index}`} source={SOIL_ASSETS[color]}
        style={[styles.wrapDemoSoil, {
          width: tile, height: tile, left: padding + col * pitch, top: padding + row * pitch,
          backgroundColor: ONBOARDING_SOIL_COLORS[color],
        }]}
        imageStyle={styles.wrapDemoSoilImage} />;
      })}
      {flowers.map((color, index) => {
        if (activeIndexes.includes(index)) return null;
        const row = Math.floor(index / 3), col = index % 3;
        return <View key={`fixed-${index}`} style={[styles.wrapDemoToken, {
          width: tile, height: tile, left: padding + col * pitch, top: padding + row * pitch,
        }]}><Image source={FLOWER_ASSETS[color]} style={styles.wrapDemoFlower} resizeMode="contain" /></View>;
      })}
      <Animated.View style={[StyleSheet.absoluteFillObject, {
        transform: [horizontal ? { translateX: travel } : { translateY: travel }],
      }]}>
        {sequence.map((color, index) => <View key={`${color}-${index}`} style={[styles.wrapDemoToken,
          horizontal
            ? { width: tile, height: tile, left: padding + (index - 1) * pitch, top: padding + pitch }
            : { width: tile, height: tile, left: padding + pitch, top: padding + (index - 1) * pitch }]}>
          <Image source={FLOWER_ASSETS[color]} style={styles.wrapDemoFlower} resizeMode="contain" />
        </View>)}
      </Animated.View>
    </View>
  </View>;
}

function SolvedGardenDemo() {
  const pattern = [0, 2, 0, 2, 0, 2, 0, 2, 0];
  return <View style={styles.solvedDemo}>
    <View style={styles.solvedDemoTop}>
      <Text style={styles.solvedDemoName}>FİLİZ · BÖLÜM 1</Text>
      <Text style={styles.solvedDemoMove}>HAMLE 4</Text>
    </View>
    <View style={styles.solvedDemoGrid}>{pattern.map((color, index) =>
      <ImageBackground key={index} source={SOIL_ASSETS[color]}
        style={[styles.solvedDemoCell, { backgroundColor: ONBOARDING_SOIL_COLORS[color] }]}
        imageStyle={styles.solvedDemoCellImage}>
        <Image source={FLOWER_ASSETS[color]} style={styles.solvedDemoFlower} resizeMode="contain" />
      </ImageBackground>)}</View>
    <View style={styles.solvedDemoBadge}><Text style={styles.solvedDemoBadgeText}>✓ TÜM RENKLER EŞLEŞTİ</Text></View>
  </View>;
}

function LevelTransitionOverlay({ level, progress }: { level: number; progress: Animated.Value }) {
  const info = levelInfo(level);
  const opacity = progress.interpolate({
    inputRange: [0, .28, 1, 1.4, 2],
    outputRange: [0, 1, 1, 1, 0],
  });
  const veilScale = progress.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [.2, 1, 1.18],
  });
  const labelScale = progress.interpolate({
    inputRange: [0, .55, 1, 1.45, 2],
    outputRange: [.7, 1.06, 1, 1, .92],
  });
  return <Animated.View pointerEvents="auto" style={[styles.levelTransition, { opacity }]}>
    <Animated.View style={[styles.levelTransitionVeil, { transform: [{ scale: veilScale }] }]} />
    <Animated.View style={[styles.levelTransitionCard, { transform: [{ scale: labelScale }] }]}>
      <Text style={styles.levelTransitionEyebrow}>{info.layer.shortName.toUpperCase()}</Text>
      <Text style={styles.levelTransitionTitle}>BÖLÜM {info.localLevel}</Text>
      <View style={styles.levelTransitionLine} />
      <Text style={styles.levelTransitionCopy}>{layerSizeLabel(info.layer)} YENİ BAHÇE</Text>
    </Animated.View>
  </Animated.View>;
}

function Home({ save, go, open, entrance }: {
  save: PlayerSave; go: (s: Screen) => void; open: (s: Sheet) => void; entrance: Animated.Value;
}) {
  const info = levelInfo(save.currentLevel);
  const levelCount = layerLevelCount(info.layer);
  const slideLeft = entrance.interpolate({ inputRange: [0, 1], outputRange: [-70, 0] });
  const slideRight = entrance.interpolate({ inputRange: [0, 1], outputRange: [70, 0] });
  const slideUp = entrance.interpolate({ inputRange: [0, 1], outputRange: [34, 0] });
  const waitingForLayer = save.completed.includes(save.currentLevel)
    && info.localLevel === layerLevelCount(info.layer)
    && info.layer.id < LEVEL_LAYERS.length
    && !save.unlockedLayers.includes(info.layer.id + 1);
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeScreen}>
    <Animated.View style={[styles.topRow, { opacity: entrance, transform: [{ translateX: slideLeft }] }]}><View /><Balances save={save} /></Animated.View>
    <Animated.View style={[styles.homeHero, { opacity: entrance, transform: [{ translateX: slideRight }] }]}><Image source={APP_ICON} style={styles.homeLogo} resizeMode="cover" /><Text style={styles.homeTitle}>Petal Shift</Text><Text style={styles.subtitle}>Her esinti yeni bir yol açar</Text></Animated.View>
    <Animated.View style={[styles.homeChapter, { opacity: entrance, transform: [{ translateX: slideLeft }] }]}>
      <Image source={UI.gate} style={styles.homeGate} resizeMode="contain" />
      <View style={styles.homeChapterInfo}>
        <Text style={styles.homeChapterEyebrow}>DEVAM ET</Text>
        <Text style={styles.homeChapterTitle}>{info.layer.name}</Text>
        <Text style={styles.homeChapterLevel}>Bölüm {info.localLevel} / {levelCount} · {layerSizeLabel(info.layer)}</Text>
        <Image source={UI.progressVine} style={styles.homeProgressVine} resizeMode="stretch" />
      </View>
    </Animated.View>
    <Animated.View style={{ opacity: entrance, transform: [{ translateY: slideUp }] }}>
      <TButton
        title={waitingForLayer ? "YENİ KATMANI AÇ" : `OYNA · ${info.layer.shortName} ${info.localLevel}`}
        onPress={() => go(waitingForLayer ? "levels" : "game")}
      />
    </Animated.View>
    <Animated.View style={[styles.menuRow, { opacity: entrance, transform: [{ translateX: slideRight }] }]}>
      <MenuButton icon={UI.levels} label="BÖLÜMLER" onPress={() => go("levels")} />
      <MenuButton icon={UI.shop} label="MAĞAZA" onPress={() => open("shop")} />
      <MenuButton icon={UI.noAds} label={save.adsRemoved ? "AKTİF" : "REKLAMSIZ"} onPress={() => open("shop")} />
      <MenuButton icon={UI.settings} label="AYARLAR" onPress={() => open("settings")} />
    </Animated.View>
    <Animated.View style={[styles.companyBrand, { opacity: entrance, transform: [{ translateY: slideUp }] }]}>
      <Image source={COMPANY_LOGO} style={styles.companyLogo} resizeMode="contain" />
      <Text style={styles.companyName}>GÖRSEN GAMES</Text>
    </Animated.View>
  </ScrollView>;
}

function MenuButton({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  const sound = React.useContext(UiSoundContext);
  return <Pressable onPress={() => { sound(); onPress(); }} style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
    <Image source={icon} style={styles.menuIconAsset} resizeMode="contain" /><Text style={styles.menuLabel}>{label}</Text>
  </Pressable>;
}

function Levels({ save, go, choose, unlockLayer, openShop, entrance }: {
  save: PlayerSave; go: (s: Screen) => void; choose: (n: number) => void;
  unlockLayer: (layerId: number) => void; openShop: () => void; entrance: Animated.Value;
}) {
  const sound = React.useContext(UiSoundContext);
  const [selectedLayerId, setSelectedLayerId] = useState(preferredLayerId(save));
  const layerTabsRef = useRef<ScrollView>(null);
  const levelListRef = useRef<FlatList<number>>(null);
  const selectedLayer = DISPLAY_LAYERS.find((layer) => layer.id === selectedLayerId) ?? PRACTICE_LAYER;
  const selectedLevelCount = layerLevelCount(selectedLayer);
  const selectedLayerUnlocked = selectedLayer.id === 0
    || (save.tutorialCompleted && save.unlockedLayers.includes(selectedLayer.id));
  const previousRequiredLayer = selectedLayer.id > 1 ? LEVEL_LAYERS[selectedLayer.id - 2] : null;
  const previousRequiredLayerOpen = !previousRequiredLayer
    || save.unlockedLayers.includes(previousRequiredLayer.id);
  const completedInLayer = save.completed.filter(
    (level) => level >= selectedLayer.start && level <= selectedLayer.end,
  ).length;

  useEffect(() => {
    requestAnimationFrame(() => {
      layerTabsRef.current?.scrollTo({ x: Math.max(0, selectedLayerId * 90 - 18), animated: false });
    });
  }, [selectedLayerId]);
  useEffect(() => {
    setSelectedLayerId(preferredLayerId(save));
  }, [save.currentLevel]);
  useEffect(() => {
    const current = levelInfo(save.currentLevel);
    if (current.layer.id !== selectedLayer.id) return;
    const row = Math.max(0, Math.floor((current.localLevel - 1) / 5));
    const estimatedRowHeight = 78;
    requestAnimationFrame(() => {
      levelListRef.current?.scrollToOffset({
        offset: Math.max(0, row * estimatedRowHeight - estimatedRowHeight),
        animated: false,
      });
    });
  }, [save.currentLevel, selectedLayer.id, selectedLevelCount]);

  const enterX = entrance.interpolate({ inputRange: [0, 1], outputRange: [width * .34, 0] });
  return <Animated.View style={[styles.levelsScreen, { opacity: entrance, transform: [{ translateX: enterX }] }]}>
    <View style={styles.topRow}><View style={styles.navButtons}>
      <RoundButton icon={UI.home} onPress={() => go("home")} />
      <RoundButton icon={UI.shop} onPress={openShop} />
    </View><Balances save={save} /></View>
    <Text style={styles.pageTitle}>Bahçe Katmanları</Text><Text style={styles.pageCopy}>Katmanları sırayla 50 Koru Taşı ile aç · Önceki bölümleri bitirmen gerekmez</Text>
    <ScrollView ref={layerTabsRef} horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.layerTabsContent} style={styles.layerTabs}>
      {DISPLAY_LAYERS.map((layer) => {
        const selected = layer.id === selectedLayer.id;
        const unlocked = layer.id === 0
          || (save.tutorialCompleted && save.unlockedLayers.includes(layer.id));
        const completed = save.completed.filter((level) => level >= layer.start && level <= layer.end).length;
        const tabLevelCount = layerLevelCount(layer);
        return <Pressable key={layer.id} onPress={() => { sound(); setSelectedLayerId(layer.id); }}
          style={({ pressed }) => [
            styles.layerTab,
            selected && styles.layerTabSelected,
            !unlocked && styles.layerTabLocked,
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.layerTabSize, selected && styles.layerTabTextSelected]}>{layerSizeLabel(layer)}</Text>
          <Text numberOfLines={1} style={[styles.layerTabName, selected && styles.layerTabTextSelected]}>{layer.shortName}</Text>
          <Text style={[styles.layerTabColors, selected && styles.layerTabTextSelected]}>{layerPaletteLabel(layer)} RENK</Text>
          <Text style={[styles.layerTabProgress, selected && styles.layerTabTextSelected]}>
            {unlocked ? `${completed}/${tabLevelCount}` : "KİLİTLİ"}
          </Text>
        </Pressable>;
      })}
    </ScrollView>
    <View style={[styles.layerCard, !selectedLayerUnlocked && styles.lockedLayerCard]}>
      <ImageBackground source={UI.chapterCard} style={styles.gateFrame} resizeMode="stretch">
        <Image source={UI.gate} style={styles.gateArt} resizeMode="contain" />
      </ImageBackground>
      <View style={styles.layerInfo}><Text style={styles.layerTitle}>{selectedLayer.name}</Text>
        {selectedLayerUnlocked ? <>
          <Text style={styles.layerCopy}>{layerSizeLabel(selectedLayer)} · {layerPaletteLabel(selectedLayer)} renk · {completedInLayer} / {selectedLevelCount} tamamlandı</Text>
          <Image source={UI.progressVine} style={styles.progressVine} resizeMode="stretch" />
        </> : !save.tutorialCompleted ? <>
          <Text style={styles.layerLockedTitle}>ÖNCE ALIŞTIRMAYI TAMAMLA</Text>
          <Text style={styles.layerCopy}>2×3 sekmesindeki 3 kısa bölümü bitirdiğinde gerçek katmanlar açılır.</Text>
        </> : !previousRequiredLayerOpen ? <>
          <Text style={styles.layerLockedTitle}>ÖNCE {previousRequiredLayer?.shortName.toUpperCase()} KATMANINI AÇ</Text>
          <Text style={styles.layerCopy}>Katmanlar sırayla açılır. Bölümleri tamamlaman gerekmez.</Text>
        </> : <>
          <Text style={styles.layerLockedTitle}>KATMAN KİLİTLİ</Text>
          <View style={styles.layerCostRow}>
            <Image source={UI.currencyStone} style={styles.layerCostIcon} resizeMode="contain" />
            <Text style={styles.layerCostText}>{LAYER_UNLOCK_COST} Koru Taşı</Text>
          </View>
          <Pressable onPress={() => { sound(); unlockLayer(selectedLayer.id); }}
            style={({ pressed }) => [styles.layerUnlockButton, pressed && styles.pressed]}>
            <Text style={styles.layerUnlockButtonText}>KATMANI AÇ</Text>
          </Pressable>
        </>}
      </View>
    </View>
    <FlatList ref={levelListRef} key={`layer-${selectedLayer.id}`} style={styles.levelList}
      data={Array.from({ length: selectedLevelCount }, (_, i) => i + 1)}
      numColumns={5} keyExtractor={(item) => `level-${selectedLayer.id}-${item}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.levelListContent} renderItem={({ item }) => {
        const globalLevel = selectedLayer.start + item - 1;
        const done = save.completed.includes(globalLevel), current = globalLevel === save.currentLevel;
        const unlocked = levelIsUnlocked(save, globalLevel);
        const starCount = save.stars[String(globalLevel)] ?? 0;
        return <Pressable disabled={!unlocked} onPress={() => { sound(); choose(globalLevel); }}
          style={({ pressed }) => [styles.levelTile, !unlocked && styles.levelTileLocked, pressed && styles.pressed]}>
          <ImageBackground source={current ? UI.levelCurrent : done ? UI.levelCompleted : UI.levelNormal} resizeMode="stretch" style={styles.levelTileAsset}>
            <Text style={[styles.levelText, current && { color: C.gold }, !unlocked && styles.levelTextLocked]}>
              {unlocked ? item : "•"}
            </Text>
            {done && starCount > 0 && <View style={styles.levelMiniStars}>
              {[0, 1, 2].map((star) => <Image key={star} source={star < starCount ? UI.starFilled : UI.starEmpty}
                style={[styles.levelMiniStar, star >= starCount && styles.levelMiniStarEmpty]} resizeMode="contain" />)}
            </View>}
            {done && !current && <Image source={UI.check} style={styles.levelCheck} resizeMode="contain" />}
            {!unlocked && <Text style={styles.levelLockMark}>KİLİT</Text>}
          </ImageBackground>
        </Pressable>;
      }} />
  </Animated.View>;
}

function Game({ save, board, rows, cols, target, moves, move, activeMove, slideProgress, animating, completing, completionProgress, dragSfx, back, home, openShop, hint, reset }: {
  save: PlayerSave; board: number[]; rows: number; cols: number; target: number[];
  moves: number; move: (m: Move, initialProgress?: number) => void;
  activeMove: Move | null; slideProgress: Animated.Value; animating: boolean;
  completing: boolean; completionProgress: Animated.Value;
  dragSfx: () => void;
  openShop: () => void;
  back: () => void; home: () => void; hint: (animate?: (duration: number) => void) => void; reset: () => void;
}) {
  // Board border (8), inner padding (10) and inter-cell gaps must all be
  // removed before the cell width is calculated. Otherwise the last row wraps
  // outside the garden on narrow phones.
  const widthCell = (BOARD_SIZE - 18 - (cols - 1) * 5) / cols;
  const heightCell = (BOARD_HEIGHT_LIMIT - 18 - (rows - 1) * 5) / rows;
  const cell = Math.min(widthCell, heightCell);
  const step = cell + 5;
  const inset = 9;
  const boardWidth = 18 + cols * cell + (cols - 1) * 5;
  const boardHeight = 18 + rows * cell + (rows - 1) * 5;
  const info = levelInfo(save.currentLevel);
  const levelCount = layerLevelCount(info.layer);
  const dragProgress = useRef(new Animated.Value(0)).current;
  const liftProgress = useRef(new Animated.Value(0)).current;
  const landProgress = useRef(new Animated.Value(0)).current;
  const dragStart = useRef({ x: 0, y: 0 });
  const [dragMove, setDragMove] = useState<Move | null>(null);
  const dragMoveRef = useRef<Move | null>(null);
  const liftedRef = useRef(false);
  const dragFrameRef = useRef<number | null>(null);
  const pendingDragProgress = useRef(0);

  const cancelDragFrame = () => {
    if (dragFrameRef.current !== null) {
      cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
  };

  const updateDragProgress = (value: number) => {
    pendingDragProgress.current = value;
    if (dragFrameRef.current !== null) return;
    dragFrameRef.current = requestAnimationFrame(() => {
      dragFrameRef.current = null;
      dragProgress.setValue(pendingDragProgress.current);
    });
  };

  useEffect(() => () => {
    if (dragFrameRef.current !== null) cancelAnimationFrame(dragFrameRef.current);
  }, []);

  const updateDragMove = (next: Move | null) => {
    const old = dragMoveRef.current;
    if (old?.type === next?.type && old?.index === next?.index && old?.direction === next?.direction) return;
    dragMoveRef.current = next;
    setDragMove(next);
  };

  const moveFromGesture = (dx: number, dy: number): Move | null => {
    const { x, y } = dragStart.current;
    if (x < inset || x > boardWidth - inset || y < inset || y > boardHeight - inset) return null;
    const horizontal = Math.abs(dx) > Math.abs(dy) * 1.12;
    const vertical = Math.abs(dy) > Math.abs(dx) * 1.12;
    if (!horizontal && !vertical) return null;
    const localX = x - inset;
    const localY = y - inset;
    const startCol = Math.floor(localX / step);
    const startRow = Math.floor(localY / step);
    const inCellX = localX - startCol * step;
    const inCellY = localY - startRow * step;
    if (
      startCol < 0 || startCol >= cols || startRow < 0 || startRow >= rows
      || inCellX > cell || inCellY > cell
    ) return null;
    if (horizontal) {
      return { type: "row", index: startRow, direction: dx > 0 ? 1 : -1 };
    }
    return { type: "column", index: startCol, direction: dy > 0 ? 1 : -1 };
  };

  const lockedMoveFromGesture = (dx: number, dy: number): Move | null => {
    const locked = dragMoveRef.current;
    if (!locked) return moveFromGesture(dx, dy);
    const axisDistance = locked.type === "row" ? dx : dy;
    const direction: -1 | 1 = axisDistance === 0 ? locked.direction : axisDistance > 0 ? 1 : -1;
    return { ...locked, direction };
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !animating,
    onMoveShouldSetPanResponder: (_, gesture) => !animating && Math.max(Math.abs(gesture.dx), Math.abs(gesture.dy)) > 4,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (event) => {
      // The responder lives on a childless overlay, therefore locationX/Y are
      // always measured from the board itself, never from a flower or soil tile.
      dragStart.current = {
        x: event.nativeEvent.locationX,
        y: event.nativeEvent.locationY,
      };
      cancelDragFrame();
      dragProgress.stopAnimation();
      liftProgress.stopAnimation();
      landProgress.stopAnimation();
      pendingDragProgress.current = 0;
      dragProgress.setValue(0);
      liftProgress.setValue(0);
      landProgress.setValue(0);
      liftedRef.current = false;
      updateDragMove(null);
    },
    onPanResponderMove: (_, gesture) => {
      const candidate = lockedMoveFromGesture(gesture.dx, gesture.dy);
      if (!candidate) {
        updateDragProgress(0);
        updateDragMove(null);
        return;
      }
      if (!liftedRef.current) {
        liftedRef.current = true;
        dragSfx();
        Animated.timing(liftProgress, {
          toValue: 1,
          duration: 90,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
          isInteraction: false,
        }).start();
      }
      const distance = candidate.type === "row" ? Math.abs(gesture.dx) : Math.abs(gesture.dy);
      const lineLength = candidate.type === "row" ? cols : rows;
      updateDragProgress(Math.min(lineLength - 1, distance / step));
      updateDragMove(candidate);
    },
    onPanResponderRelease: (_, gesture) => {
      const candidate = lockedMoveFromGesture(gesture.dx, gesture.dy);
      const distance = candidate ? (candidate.type === "row" ? Math.abs(gesture.dx) : Math.abs(gesture.dy)) : 0;
      const progress = distance / step;
      if (candidate && progress >= .26) {
        const lineLength = candidate.type === "row" ? cols : rows;
        const amount = Math.min(lineLength - 1, Math.max(1, Math.round(progress)));
        const carriedProgress = Math.min(lineLength - 1, progress);
        const settleDuration = Math.min(600, 180 + 320 * Math.abs(amount - carriedProgress));
        cancelDragFrame();
        pendingDragProgress.current = carriedProgress;
        dragProgress.setValue(carriedProgress);
        landProgress.setValue(0);
        Animated.parallel([
          Animated.timing(liftProgress, {
            toValue: 0,
            duration: settleDuration,
            easing: Easing.bezier(.2, .9, .25, 1),
            useNativeDriver: false,
            isInteraction: false,
          }),
          Animated.timing(landProgress, {
            toValue: 1,
            duration: settleDuration,
            easing: Easing.linear,
            useNativeDriver: false,
            isInteraction: false,
          }),
        ]).start(() => { liftedRef.current = false; });
        move({ ...candidate, amount }, carriedProgress);
        requestAnimationFrame(() => updateDragMove(null));
      } else {
        cancelDragFrame();
        dragProgress.setValue(pendingDragProgress.current);
        landProgress.setValue(0);
        Animated.parallel([
          Animated.timing(dragProgress, {
            toValue: 0, duration: 220, easing: Easing.bezier(.2, .9, .25, 1),
            useNativeDriver: false, isInteraction: false,
          }),
          Animated.timing(liftProgress, {
            toValue: 0, duration: 220, easing: Easing.bezier(.2, .9, .25, 1),
            useNativeDriver: false, isInteraction: false,
          }),
          Animated.timing(landProgress, {
            toValue: 1, duration: 220, easing: Easing.linear,
            useNativeDriver: false, isInteraction: false,
          }),
        ]).start(() => {
          liftedRef.current = false;
          updateDragMove(null);
        });
      }
    },
    onPanResponderTerminate: () => {
      cancelDragFrame();
      dragProgress.setValue(pendingDragProgress.current);
      landProgress.setValue(0);
      Animated.parallel([
        Animated.timing(dragProgress, {
          toValue: 0, duration: 220, easing: Easing.bezier(.2, .9, .25, 1),
          useNativeDriver: false, isInteraction: false,
        }),
        Animated.timing(liftProgress, {
          toValue: 0, duration: 220, easing: Easing.bezier(.2, .9, .25, 1),
          useNativeDriver: false, isInteraction: false,
        }),
        Animated.timing(landProgress, {
          toValue: 1, duration: 220, easing: Easing.linear,
          useNativeDriver: false, isInteraction: false,
        }),
      ]).start(() => {
        liftedRef.current = false;
        updateDragMove(null);
      });
    },
  }), [animating, cell, rows, cols, step, boardHeight, move, liftProgress, landProgress, dragSfx]);

  const runHintAnimation = (duration = 500) => {
    const settleDuration = Math.max(180, duration - 100);
    cancelDragFrame();
    liftProgress.stopAnimation();
    landProgress.stopAnimation();
    liftProgress.setValue(0);
    landProgress.setValue(0);
    liftedRef.current = true;
    Animated.parallel([
      Animated.sequence([
        Animated.timing(liftProgress, {
          toValue: 1, duration: 100, easing: Easing.out(Easing.cubic),
          useNativeDriver: false, isInteraction: false,
        }),
        Animated.timing(liftProgress, {
          toValue: 0, duration: settleDuration, easing: Easing.bezier(.2, .9, .25, 1),
          useNativeDriver: false, isInteraction: false,
        }),
      ]),
      Animated.sequence([
        Animated.delay(100),
        Animated.timing(landProgress, {
          toValue: 1, duration: settleDuration, easing: Easing.linear,
          useNativeDriver: false, isInteraction: false,
        }),
      ]),
    ]).start(() => { liftedRef.current = false; });
  };
  const playHint = () => hint(runHintAnimation);

  const shownMove = activeMove || dragMove;
  const shownProgress = activeMove ? slideProgress : dragMove ? dragProgress : slideProgress;
  const completionScale = completionProgress.interpolate({
    inputRange: [0, .18, .48, .76, 1],
    outputRange: [.82, 1, 1.06, 1, .96],
  });
  const completionY = completionProgress.interpolate({
    inputRange: [0, .2, .7, 1], outputRange: [18, 0, 0, -8],
  });
  const completionOpacity = completionProgress.interpolate({
    inputRange: [0, .15, .72, 1], outputRange: [0, 1, 1, 0],
  });
  const tokenCelebrationScale = completionProgress.interpolate({
    inputRange: [0, .18, .38, .58, .76, 1],
    outputRange: [1, 1, 1.085, .985, 1.025, 1],
  });
  const tokenCelebrationY = completionProgress.interpolate({
    inputRange: [0, .18, .38, .58, .76, 1],
    outputRange: [0, 0, -8, 2, -2, 0],
  });
  return <View style={styles.gameScreen}>
    <View style={styles.gameTop}><View style={styles.navButtons}><RoundButton icon={UI.levels} onPress={back} /><RoundButton icon={UI.home} onPress={home} /></View><View style={styles.gameHeading}><Text style={styles.gameTitle}>{info.layer.shortName}</Text><Text style={styles.gameLevel}>BÖLÜM {info.localLevel}/{levelCount} · {layerSizeLabel(info.layer)}</Text></View><View style={styles.balance}><Image source={UI.currencyLeaf} style={styles.currencyIcon} resizeMode="contain" /><Text style={styles.balanceText}>{save.hintLeaves}</Text></View></View>
    <Text style={styles.moveCounter}>HAMLE · {moves}</Text>
    <Text style={styles.swipeGuide}>Bir sırayı istediğin kadar sürükle</Text>
    <View style={{ alignItems: "center", marginTop: 10 }}>
        <View style={[styles.board, { width: boardWidth, height: boardHeight }]}>
          {board.map((_, i) => {
            const targetValue = target[i];
            return <ImageBackground key={`soil-${i}`} source={SOIL_ASSETS[targetValue]} resizeMode="stretch"
              imageStyle={styles.soilTexture} style={[styles.plot, { width: cell, height: cell, backgroundColor: COLORS[targetValue].soil }]} />;
          })}
          <Animated.View pointerEvents="none" style={[
            StyleSheet.absoluteFillObject,
            {
              transform: completing
                ? [{ translateY: tokenCelebrationY }, { scale: tokenCelebrationScale }]
                : [],
            },
          ]}>
            <MovingTokens board={board} rows={rows} cols={cols} cell={cell} move={shownMove}
              progress={shownProgress} lift={liftProgress} landing={landProgress} />
          </Animated.View>
          <BoardFrame />
          {completing && <Animated.View pointerEvents="none" style={[
            styles.completionFx,
            {
              opacity: completionOpacity,
              transform: [{ translateY: completionY }, { scale: completionScale }],
            },
          ]}>
            <View style={styles.completionHalo}>
              <Text style={styles.completionStar}>✦</Text>
              <Text style={styles.completionLabel}>BAHÇE UYANDI</Text>
            </View>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((particle) => {
              const angle = particle * Math.PI / 4;
              return <View key={particle} style={[
                styles.completionParticle,
                {
                  left: boardWidth / 2 - 4 + Math.cos(angle) * boardWidth * .34,
                  top: boardHeight / 2 - 4 + Math.sin(angle) * boardHeight * .34,
                },
              ]} />;
            })}
          </Animated.View>}
          <View {...panResponder.panHandlers} style={styles.gestureSurface} />
        </View>
    </View>
    <View style={styles.gameActions}>
      <RoundButton icon={UI.reset} onPress={reset} />
      <RoundButton icon={UI.hint} freeHints={save.freeHints > 0 ? save.freeHints : undefined}
        cost={save.freeHints > 0 ? undefined : 3} onPress={playHint} />
      <RoundButton icon={UI.shop} onPress={openShop} />
    </View>
    {animating && <View pointerEvents="auto" onStartShouldSetResponder={() => true} style={styles.interactionLock} />}
  </View>;
}

function MovingTokens({ board, rows, cols, cell, move, progress, lift, landing }: {
  board: number[]; rows: number; cols: number; cell: number; move: Move | null;
  progress: Animated.Value; lift: Animated.Value; landing: Animated.Value;
}) {
  const gap = 5;
  const inset = 9;
  const step = cell + gap;
  const liftScale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.065] });
  const liftY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -cell * .03] });
  const landingScale = landing.interpolate({
    inputRange: [0, .72, .88, 1],
    outputRange: [1, 1, .985, 1],
  });
  const landingY = landing.interpolate({
    inputRange: [0, .72, .88, 1],
    outputRange: [0, 0, cell * .012, 0],
  });
  const token = (value: number, key: string, row: number, col: number, transform: any[] = [], lifted = false) =>
    <Animated.View key={key} pointerEvents="none" collapsable={false}
      style={[
      styles.tokenSlot,
      lifted && styles.tokenSlotLifted,
      {
        width: cell,
        height: cell,
        left: inset + col * step,
        top: inset + row * step,
        transform: lifted
          ? [...transform, { translateY: liftY }, { translateY: landingY }, { scale: liftScale }, { scale: landingScale }]
          : transform,
      },
    ]}>
      <Image source={FLOWER_ASSETS[value]} resizeMode="contain" style={{ width: cell * .64, height: cell * .64 }} />
      <View style={[styles.tokenCenter, { width: cell * .105, height: cell * .105, borderRadius: cell }]} />
    </Animated.View>;

  const travel = move ? Animated.multiply(progress, step * move.direction) : null;
  const sprites = board.map((value, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const affected = move && (move.type === "row" ? row === move.index : col === move.index);
    if (affected) return null;
    const transform: any[] = [];
    return token(value, `token-${index}-${value}`, row, col, transform, false);
  });

  // Draw the moving line only through this wrap renderer. Rendering the same
  // flower both in its base cell and as a moving copy can make iOS briefly
  // flatten or reorder layers, which appears as a disappearing or color-flip
  // frame during fast swipes.
  if (move) {
    const lineLength = move.type === "row" ? cols : rows;
    for (const side of [-1, 0, 1]) {
      const wrappedTravel = Animated.add(travel!, side * lineLength * step);
      for (let position = 0; position < lineLength; position += 1) {
        const row = move.type === "row" ? move.index : position;
        const col = move.type === "column" ? move.index : position;
        const value = board[row * cols + col];
        sprites.push(token(
          value,
          `wrapping-token-${move.type}-${move.index}-${side}-${position}-${value}`,
          row,
          col,
          [move.type === "row" ? { translateX: wrappedTravel } : { translateY: wrappedTravel }],
          true,
        ));
      }
    }
  }
  return <>{sprites}</>;
}

function BoardFrame() {
  const rail = 12;
  const corner = 18;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Image source={UI.frameTop} resizeMode="stretch" style={[styles.frameRailH, { top: 1, left: corner - 4, right: corner - 4, height: rail }]} />
    <Image source={UI.frameBottom} resizeMode="stretch" style={[styles.frameRailH, { bottom: 1, left: corner - 4, right: corner - 4, height: rail }]} />
    <Image source={UI.frameLeft} resizeMode="stretch" style={[styles.frameRailV, { left: 1, top: corner - 4, bottom: corner - 4, width: rail }]} />
    <Image source={UI.frameRight} resizeMode="stretch" style={[styles.frameRailV, { right: 1, top: corner - 4, bottom: corner - 4, width: rail }]} />
  </View>;
}

function Wind({ text, onPress, disabled = false }: { text: string; onPress: () => void; disabled?: boolean }) {
  const sound = React.useContext(UiSoundContext);
  return <Pressable hitSlop={8} disabled={disabled} onPress={() => { sound(); onPress(); }} style={({ pressed }) => [styles.wind, pressed && styles.pressed]}>
    {({ pressed }) => <><Image source={disabled ? UI.buttonDisabled : pressed ? UI.buttonPressed : UI.button} resizeMode="contain" style={styles.windAsset} /><Text style={[styles.windText, disabled && { opacity: .5 }]}>{text}</Text></>}
  </Pressable>;
}

function Reward({ save, moves, idealMoves, doubled, adLoading, accepting, doubleReward, next, home }: {
  save: PlayerSave; moves: number; idealMoves: number; doubled: boolean; adLoading: boolean; accepting: boolean; doubleReward: () => void; next: () => void; home: () => void;
}) {
  const first = !save.rewarded.includes(save.currentLevel);
  const info = levelInfo(save.currentLevel);
  const levelCount = layerLevelCount(info.layer);
  const rewardsAvailable = first && info.layer.id > 0;
  const delayedContinue = first && info.layer.id > 0 && info.localLevel % 3 === 0;
  const stars = levelStarScore(moves, idealMoves);
  const multiplier = doubled ? 2 : 1;
  const leafReward = rewardsAvailable ? 3 * multiplier : 0;
  const stoneReward = rewardsAvailable ? 1 * multiplier : 0;
  const countProgress = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const continueReveal = useRef(new Animated.Value(delayedContinue ? 0 : 1)).current;
  const starProgress = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const [shownLeaves, setShownLeaves] = useState(save.hintLeaves);
  const [shownStones, setShownStones] = useState(save.layerStones);
  const [continueReady, setContinueReady] = useState(!delayedContinue);

  useEffect(() => {
    countProgress.stopAnimation();
    reveal.stopAnimation();
    countProgress.setValue(0);
    reveal.setValue(0);
    setShownLeaves(save.hintLeaves);
    setShownStones(save.layerStones);
    const listener = countProgress.addListener(({ value }) => {
      setShownLeaves(Math.round(save.hintLeaves + leafReward * value));
      setShownStones(Math.round(save.layerStones + stoneReward * value));
    });
    starProgress.forEach((progress) => progress.setValue(0));
    Animated.parallel([
      Animated.timing(countProgress, {
        toValue: 1, duration: 1050, easing: Easing.out(Easing.cubic), useNativeDriver: false,
      }),
      Animated.timing(reveal, {
        toValue: 1, duration: 620, easing: Easing.bezier(.2, .9, .25, 1), useNativeDriver: true,
      }),
      Animated.stagger(240, starProgress.map((progress) => Animated.spring(progress, {
        toValue: 1,
        friction: 5,
        tension: 95,
        useNativeDriver: true,
      }))),
    ]).start();
    return () => countProgress.removeListener(listener);
  }, [leafReward, stoneReward, save.hintLeaves, save.layerStones, stars]);

  useEffect(() => {
    continueReveal.stopAnimation();
    continueReveal.setValue(delayedContinue ? 0 : 1);
    setContinueReady(!delayedContinue);
    if (!delayedContinue) return undefined;
    const timer = setTimeout(() => {
      setContinueReady(true);
      Animated.timing(continueReveal, {
        toValue: 1,
        duration: 760,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 3000);
    return () => clearTimeout(timer);
  }, [delayedContinue, save.currentLevel]);

  const cardY = reveal.interpolate({ inputRange: [0, 1], outputRange: [32, 0] });
  const cardScale = reveal.interpolate({ inputRange: [0, 1], outputRange: [.92, 1] });
  const continueY = continueReveal.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return <View style={[styles.screen, { alignItems: "center" }]}>
    <View style={styles.rewardHome}><RoundButton icon={UI.home} onPress={home} /></View>
    <Animated.View style={[styles.starRewardCard, { opacity: reveal, transform: [{ translateY: cardY }, { scale: cardScale }] }]}>
      <View style={styles.starRewardOrnament} />
      <Text style={styles.rewardKicker}>{info.layer.name} · BÖLÜM {info.localLevel}/{levelCount}</Text>
      <Text style={styles.rewardTitle}>Bahçe uyandı!</Text>
      <View style={styles.starRow}>
        {[0, 1, 2].map((index) => {
          const progress = starProgress[index];
          const scale = progress.interpolate({ inputRange: [0, .7, 1], outputRange: [.35, 1.18, 1] });
          const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ["-14deg", "0deg"] });
          const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
          const won = index < stars;
          return <Animated.View key={index} style={[
            styles.starSlot,
            index === 1 && styles.starSlotCenter,
            { opacity: progress, transform: [{ translateY }, { scale }, { rotate }] },
          ]}>
            {won && <View style={styles.starGlow} />}
            <Image source={won ? UI.starFilled : UI.starEmpty} style={styles.rewardStarIcon} resizeMode="contain" />
          </Animated.View>;
        })}
      </View>
      <View style={styles.starDivider}><View style={styles.starDividerLine} /><Text style={styles.starDividerLeaf}>◆</Text><View style={styles.starDividerLine} /></View>
      <View style={styles.rewardStatsCard}>
        <View style={styles.rewardStat}><Text style={styles.rewardStatLabel}>HAMLE</Text><Text style={styles.rewardStatValue}>{moves}</Text></View>
      </View>
      <Text style={styles.rewardCopy}>
        {stars === 3 ? "Harika! 3 yıldızlık çözüm." : stars === 2 ? "Güzel çözüm! Biraz daha az hamleyle 3 yıldız." : "Bölüm tamamlandı. Daha kısa çözümle yıldızını artır."}
      </Text>
      <View style={styles.rewardCurrencyPanel}>
        <Text style={styles.rewardSectionTitle}>ÖDÜLLER</Text>
        <View style={styles.rewardCurrencyGrid}>
          <View style={styles.rewardCurrencyBox}>
            <Image source={UI.currencyLeaf} style={styles.rewardCurrencyIcon} resizeMode="contain" />
            <Text style={styles.rewardGain}>+{leafReward}</Text>
            <Text style={styles.rewardBalance}>{shownLeaves}</Text>
          </View>
          <View style={styles.rewardCurrencyBox}>
            <Image source={UI.currencyStone} style={styles.rewardCurrencyIcon} resizeMode="contain" />
            <Text style={styles.rewardGain}>+{stoneReward}</Text>
            <Text style={styles.rewardBalance}>{shownStones}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
    {rewardsAvailable && <TButton title={adLoading ? "REKLAM AÇILIYOR…" : doubled ? "✓ ÖDÜL 2× OLDU" : "▶ REKLAM İZLE · 2× KAZAN"} secondary disabled={doubled || adLoading || accepting} onPress={doubleReward} />}
    {continueReady && <Animated.View style={[
      styles.rewardContinueReveal,
      { opacity: continueReveal, transform: [{ translateY: continueY }] },
    ]}>
      <TButton title={accepting ? "DEVAM EDİLİYOR…" : "ÖDÜLÜ AL · DEVAM"} disabled={accepting} onPress={next} />
    </Animated.View>}
  </View>;
}

function HintConfirmModal({ visible, leaves, cancel, confirm }: {
  visible: boolean; leaves: number; cancel: () => void; confirm: () => void;
}) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
    <View style={styles.hintConfirmBackdrop}>
      <View style={styles.hintConfirmCard}>
        <View style={styles.hintConfirmOrnament} />
        <View style={styles.hintConfirmIconRing}>
          <Image source={UI.currencyLeaf} style={styles.hintConfirmIcon} resizeMode="contain" />
        </View>
        <Text style={styles.hintConfirmEyebrow}>ÜCRETSİZ HAKLAR BİTTİ</Text>
        <Text style={styles.hintConfirmTitle}>İpucu kullanılsın mı?</Text>
        <Text style={styles.hintConfirmCopy}>Bir sonraki doğru hamle gösterilecek ve bakiyenden 3 İpucu Yaprağı eksilecek.</Text>
        <View style={styles.hintCostRow}>
          <View style={styles.hintCostChip}>
            <Image source={UI.currencyLeaf} style={styles.hintCostIcon} resizeMode="contain" />
            <Text style={styles.hintCostText}>−3</Text>
          </View>
          <Text style={styles.hintBalanceText}>Mevcut bakiye: {leaves}</Text>
        </View>
        <TButton title="3 YAPRAK KULLAN" onPress={confirm} />
        <TButton title="VAZGEÇ" secondary onPress={cancel} />
      </View>
    </View>
  </Modal>;
}

function LayerUnlockModal({ layerId, stones, cancel, confirm }: {
  layerId: number | null; stones: number; cancel: () => void; confirm: () => void;
}) {
  const layer = layerId === null ? null : LEVEL_LAYERS[layerId - 1];
  return <Modal visible={!!layer} transparent animationType="fade" onRequestClose={cancel}>
    <View style={styles.hintConfirmBackdrop}>
      <View style={styles.hintConfirmCard}>
        <View style={styles.hintConfirmOrnament} />
        <View style={styles.hintConfirmIconRing}>
          <Image source={UI.currencyStone} style={styles.hintConfirmIcon} resizeMode="contain" />
        </View>
        <Text style={styles.hintConfirmEyebrow}>YENİ BAHÇE KATMANI</Text>
        <Text style={styles.hintConfirmTitle}>{layer?.name}</Text>
        <Text style={styles.hintConfirmCopy}>
          Bu katmanı açtığında {layer ? layerLevelCount(layer) : 0} yeni bölüm oynanabilir olacak.
        </Text>
        <View style={styles.hintCostRow}>
          <View style={styles.hintCostChip}>
            <Image source={UI.currencyStone} style={styles.hintCostIcon} resizeMode="contain" />
            <Text style={styles.hintCostText}>−{LAYER_UNLOCK_COST}</Text>
          </View>
          <Text style={styles.hintBalanceText}>Mevcut bakiye: {stones}</Text>
        </View>
        <TButton title={`${LAYER_UNLOCK_COST} TAŞLA AÇ`} onPress={confirm} />
        <TButton title="VAZGEÇ" secondary onPress={cancel} />
      </View>
    </View>
  </Modal>;
}

function InsufficientStoneModal({ layerId, stones, cancel, openShop }: {
  layerId: number | null; stones: number; cancel: () => void; openShop: () => void;
}) {
  const layer = layerId === null ? null : LEVEL_LAYERS[layerId - 1];
  const missing = Math.max(0, LAYER_UNLOCK_COST - stones);
  return <Modal visible={!!layer} transparent animationType="fade" onRequestClose={cancel}>
    <View style={styles.hintConfirmBackdrop}>
      <View style={styles.hintConfirmCard}>
        <View style={styles.hintConfirmOrnament} />
        <View style={styles.hintConfirmIconRing}>
          <Image source={UI.currencyStone} style={styles.hintConfirmIcon} resizeMode="contain" />
        </View>
        <Text style={styles.hintConfirmEyebrow}>KORU TAŞI YETERSİZ</Text>
        <Text style={styles.hintConfirmTitle}>{layer?.name} henüz açılamıyor</Text>
        <Text style={styles.hintConfirmCopy}>
          Bu katman için {LAYER_UNLOCK_COST} Koru Taşı gerekiyor. Mağazadan Koru Taşı almak ister misin?
        </Text>
        <View style={styles.hintCostRow}>
          <View style={styles.hintCostChip}>
            <Image source={UI.currencyStone} style={styles.hintCostIcon} resizeMode="contain" />
            <Text style={styles.hintCostText}>{stones} / {LAYER_UNLOCK_COST}</Text>
          </View>
          <Text style={styles.hintBalanceText}>{missing} taş eksik</Text>
        </View>
        <TButton title="MAĞAZAYA GİT" onPress={openShop} />
        <TButton title="ŞİMDİ DEĞİL" secondary onPress={cancel} />
      </View>
    </View>
  </Modal>;
}

function ReviewPromptModal({ visible, cancel, confirm }: {
  visible: boolean; cancel: () => void; confirm: () => void;
}) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
    <View style={styles.hintConfirmBackdrop}>
      <View style={styles.hintConfirmCard}>
        <View style={styles.hintConfirmOrnament} />
        <View style={styles.hintConfirmIconRing}>
          <Image source={APP_ICON} style={styles.reviewPromptIcon} resizeMode="cover" />
        </View>
        <Text style={styles.hintConfirmEyebrow}>PETAL SHIFT'I DEĞERLENDİR</Text>
        <Text style={styles.hintConfirmTitle}>Oyunu seviyorsan bize destek olur musun?</Text>
        <Text style={styles.hintConfirmCopy}>
          Kısa bir App Store değerlendirmesi yeni oyunculara ulaşmamıza yardımcı olur.
        </Text>
        <TButton title="DEĞERLENDİR" onPress={confirm} />
        <TButton title="DAHA SONRA" secondary onPress={cancel} />
      </View>
    </View>
  </Modal>;
}

function UpdatePromptModal({ version, cancel, confirm }: {
  version: string; cancel: () => void; confirm: () => void;
}) {
  return <Modal visible={!!version} transparent animationType="fade" onRequestClose={cancel}>
    <View style={styles.hintConfirmBackdrop}>
      <View style={styles.hintConfirmCard}>
        <View style={styles.hintConfirmOrnament} />
        <View style={styles.hintConfirmIconRing}>
          <Image source={APP_ICON} style={styles.reviewPromptIcon} resizeMode="cover" />
        </View>
        <Text style={styles.hintConfirmEyebrow}>YENİ GÜNCELLEME VAR</Text>
        <Text style={styles.hintConfirmTitle}>Petal Shift {version}</Text>
        <Text style={styles.hintConfirmCopy}>
          Petal Shift için yeni bir sürüm hazır. En iyi deneyim için App Store'dan güncelle.
        </Text>
        <TButton title="GÜNCELLE" onPress={confirm} />
        <TButton title="DAHA SONRA" secondary onPress={cancel} />
      </View>
    </View>
  </Modal>;
}

type ShopProduct = {
  productId: string;
  currency: "leaf" | "stone" | "removeAds";
  amount: number;
  price: string;
  title: string;
  icon: any;
};

const SHOP_PRODUCTS: ShopProduct[] = [
  { productId: "petalshift_hint_leaves_20_v2", currency: "leaf", amount: 20, price: "₺29,99", title: "İpucu Yaprağı", icon: UI.currencyLeaf },
  { productId: "petalshift_hint_leaves_70", currency: "leaf", amount: 70, price: "₺69,99", title: "İpucu Yaprağı", icon: UI.currencyLeaf },
  { productId: "petalshift_hint_leaves_180", currency: "leaf", amount: 180, price: "₺149,99", title: "İpucu Yaprağı", icon: UI.currencyLeaf },
  { productId: "petalshift_grove_stones_10", currency: "stone", amount: 10, price: "₺39,99", title: "Koru Taşı", icon: UI.currencyStone },
  { productId: "petalshift_grove_stones_35", currency: "stone", amount: 35, price: "₺99,99", title: "Koru Taşı", icon: UI.currencyStone },
  { productId: "petalshift_grove_stones_100", currency: "stone", amount: 100, price: "₺249,99", title: "Koru Taşı", icon: UI.currencyStone },
  { productId: "petalshift_remove_ads", currency: "removeAds", amount: 1, price: "₺149,99", title: "Reklam Engelleme", icon: UI.shop },
];
const SHOP_PRODUCTS_BY_ID = Object.fromEntries(SHOP_PRODUCTS.map((product) => [product.productId, product])) as Record<string, ShopProduct>;
const IAP_NON_CONSUMABLE_IDS = new Set(["petalshift_remove_ads"]);
const visibleShopProducts = (currency: ShopProduct["currency"]) =>
  SHOP_PRODUCTS.filter((product) => product.currency === currency);
const IAP_PRODUCT_IDS = SHOP_PRODUCTS.map((product) => product.productId);

function GameSheet({ kind, save, close, update, confirmReset, reviewOnboarding }: {
  kind: Sheet;
  save: PlayerSave;
  close: () => void;
  update: React.Dispatch<React.SetStateAction<PlayerSave>>;
  confirmReset: () => void;
  reviewOnboarding: () => void;
}) {
  const sound = React.useContext(UiSoundContext);
  const [pendingPurchase, setPendingPurchase] = useState<ShopProduct | null>(null);
  const [storeReady, setStoreReady] = useState(false);
  const [storeMessage, setStoreMessage] = useState("");
  const [storePrices, setStorePrices] = useState<Record<string, string>>({});
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const processedPurchasesRef = useRef(new Set<string>());
  const testBuy = (product: ShopProduct) => {
    if (!__DEV__) return;
    update((old) => ({
      ...old,
      hintLeaves: old.hintLeaves + (product.currency === "leaf" ? product.amount : 0),
      layerStones: old.layerStones + (product.currency === "stone" ? product.amount : 0),
      adsRemoved: product.currency === "removeAds" ? true : old.adsRemoved,
      purchaseHistory: [
        ...(old.purchaseHistory ?? []),
        {
          id: `${Date.now()}-${product.productId}`,
          productId: product.productId,
          title: product.title,
          amount: product.amount,
          price: product.price,
          purchasedAt: new Date().toISOString(),
        },
      ].slice(-30),
    }));
  };
  const applyPurchasedProduct = useCallback((productId: string, purchaseKey?: string) => {
    const product = SHOP_PRODUCTS_BY_ID[productId];
    if (!product) return false;
    const historyId = purchaseKey || `${Date.now()}-${product.productId}`;
    update((old) => {
      const alreadyRecorded = old.purchaseHistory?.some((item) => item.id === historyId);
      return {
        ...old,
        hintLeaves: old.hintLeaves + (product.currency === "leaf" && !alreadyRecorded ? product.amount : 0),
        layerStones: old.layerStones + (product.currency === "stone" && !alreadyRecorded ? product.amount : 0),
        adsRemoved: product.currency === "removeAds" ? true : old.adsRemoved,
        purchaseHistory: alreadyRecorded ? old.purchaseHistory : [
          ...(old.purchaseHistory ?? []),
          {
            id: historyId,
            productId: product.productId,
            title: product.title,
            amount: product.amount,
            price: storePrices[product.productId] ?? product.price,
            purchasedAt: new Date().toISOString(),
          },
        ].slice(-30),
      };
    });
    setStoreMessage(product.currency === "removeAds" ? "Reklam Engelleme aktif edildi." : "Satın alma tamamlandı. Paket bakiyene eklendi.");
    return true;
  }, [storePrices, update]);
  const finishPurchase = useCallback(async (purchase: Purchase) => {
    const productId = purchase.productId || purchase.ids?.[0];
    if (!productId) return;
    const purchaseKey = purchase.id || purchase.purchaseToken || `${productId}-${purchase.transactionDate || Date.now()}`;
    if (processedPurchasesRef.current.has(purchaseKey)) return;
    processedPurchasesRef.current.add(purchaseKey);
    const applied = applyPurchasedProduct(productId, purchaseKey);
    if (!applied) return;
    await RNIap.finishTransaction({
      purchase,
      isConsumable: !IAP_NON_CONSUMABLE_IDS.has(productId),
    });
  }, [applyPurchasedProduct]);
  const prepareStore = useCallback(async () => {
    if (Platform.OS === "web") {
      setStoreReady(false);
      setStoreMessage("Satın alma sistemi hazırlanıyor. Lütfen birkaç saniye sonra tekrar dene.");
      return false;
    }
    try {
      const connected = await RNIap.initConnection();
      if (!connected) throw new Error("IAP connection failed");
      const products = await RNIap.fetchProducts({ skus: IAP_PRODUCT_IDS, type: "in-app" }) as StoreProduct[] | null;
      const prices: Record<string, string> = {};
      (products ?? []).forEach((product) => {
        const id = product.id;
        if (id && product.displayPrice) prices[id] = product.displayPrice;
      });
      setStorePrices(prices);
      setStoreReady(true);
      setStoreMessage("App Store satın alma paketleri hazır. Paket seçip Apple ödeme ekranından onaylayabilirsin.");
      return true;
    } catch {
      setStoreReady(false);
      setStoreMessage("Satın alma sistemi hazırlanıyor. Lütfen birkaç saniye sonra tekrar dene.");
      return false;
    }
  }, []);
  useEffect(() => {
    if (kind !== "shop") return undefined;
    void prepareStore();
    const updateSub = RNIap.purchaseUpdatedListener((purchase) => {
      void finishPurchase(purchase).catch(() => {
        setStoreMessage("Satın alma başlatılamadı. Lütfen bağlantını ve App Store hesabını kontrol edip tekrar dene.");
      });
    });
    const errorSub = RNIap.purchaseErrorListener(() => {
      setIsPurchasing(false);
      setPendingPurchase(null);
      setStoreMessage("Satın alma başlatılamadı. Lütfen bağlantını ve App Store hesabını kontrol edip tekrar dene.");
    });
    return () => {
      updateSub.remove();
      errorSub.remove();
    };
  }, [finishPurchase, kind, prepareStore]);
  const chooseProduct = (product: ShopProduct) => {
    sound();
    setPendingPurchase(product);
  };
  const confirmPurchase = async () => {
    if (!pendingPurchase) return;
    if (__DEV__ && !storeReady) {
      testBuy(pendingPurchase);
      setPendingPurchase(null);
      return;
    }
    setIsPurchasing(true);
    try {
      const ready = storeReady || await prepareStore();
      if (!ready) return;
      setStoreMessage("Satın alma penceresi açılıyor…");
      await RNIap.requestPurchase({
        request: {
          apple: { sku: pendingPurchase.productId },
          google: { skus: [pendingPurchase.productId] },
        },
        type: "in-app",
      });
      setPendingPurchase(null);
    } catch {
      setStoreMessage("Satın alma başlatılamadı. Lütfen bağlantını ve App Store hesabını kontrol edip tekrar dene.");
    } finally {
      setIsPurchasing(false);
    }
  };
  const restoreOwnedPurchases = async () => {
    sound();
    setIsRestoring(true);
    try {
      const ready = storeReady || await prepareStore();
      if (!ready) return;
      const purchases = await RNIap.getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
      const removeAdsPurchases = purchases.filter((purchase) => purchase.productId === "petalshift_remove_ads");
      if (removeAdsPurchases.length === 0) {
        setStoreMessage("Geri yüklenebilecek kalıcı satın alma bulunamadı.");
        return;
      }
      for (const purchase of removeAdsPurchases) {
        await finishPurchase(purchase);
      }
      setStoreMessage("Geri yükleme tamamlandı. Reklam Engelleme aktif.");
    } catch {
      setStoreMessage("Satın alma geri yüklenemedi. Lütfen daha sonra tekrar dene.");
    } finally {
      setIsRestoring(false);
    }
  };
  const closeSheet = () => {
    setPendingPurchase(null);
    close();
  };
  return <Modal visible={kind !== null} transparent animationType="slide"
    onRequestClose={() => pendingPurchase ? setPendingPurchase(null) : closeSheet()}>
    <View style={styles.modalBackdrop}><View style={styles.sheet}>
      <Pressable onPress={() => { sound(); closeSheet(); }} style={styles.sheetClose}><Text style={{ fontSize: 20 }}>×</Text></Pressable>
      {kind === "reset" && <><Text style={styles.sheetTitle}>Bölümü sıfırla</Text><Text style={styles.sheetCopy}>Bu bölümü sıfırlamak istiyor musunuz?</Text><View style={styles.confirmRow}><View style={{ flex: 1 }}><TButton title="VAZGEÇ" secondary onPress={close} /></View><View style={{ flex: 1 }}><TButton title="SIFIRLA" onPress={confirmReset} /></View></View></>}
      {kind === "settings" && <><Text style={styles.sheetTitle}>Ayarlar</Text>{(["music", "sfx", "haptics"] as const).map((key) =>
        <View style={styles.setting} key={key}><Text style={styles.settingText}>{key === "music" ? "Müzik" : key === "sfx" ? "Ses efektleri" : "Titreşim"}</Text>
          <Switch value={save.settings[key]} trackColor={{ true: C.green }} onValueChange={(value) => {
            sound();
            update((old) => ({ ...old, settings: { ...old.settings, [key]: value } }));
          }} /></View>)}
        <View style={[styles.setting, styles.languageSetting]}>
          <Text style={styles.settingText}>Dil</Text>
          <View style={styles.settingsLanguageOptions}>
            {(["tr", "en"] as const).map((language) => {
              const selected = save.settings.language === language;
              return <Pressable key={language} onPress={() => {
                sound();
                update((old) => ({ ...old, languageChosen: true, settings: { ...old.settings, language } }));
              }} style={({ pressed }) => [styles.settingsLanguageButton, selected && styles.settingsLanguageButtonSelected, pressed && styles.pressed]}>
                <NativeText style={[styles.settingsLanguageText, selected && styles.settingsLanguageTextSelected]}>
                  {language === "tr" ? "Türkçe" : "English"}
                </NativeText>
              </Pressable>;
            })}
          </View>
        </View>
        <TButton title="TANITIMI TEKRAR İNCELE" secondary onPress={reviewOnboarding} /></>}
      {kind === "shop" && <><Text style={styles.sheetTitle}>Koru Dükkânı</Text>
        <Text style={styles.sheetCopy}>{__DEV__ && !storeReady ? "Test mağazası açık. Paketi seçip açılan ekrandan onaylayabilirsin." : "App Store satın alma paketleri hazır. Paket seçip Apple ödeme ekranından onaylayabilirsin."}</Text>
        {!!storeMessage && <Text style={styles.storeStatusText}>{storeMessage}</Text>}
        <View style={styles.shopBalance}><Balances save={save} /></View>
        <Text style={styles.groupTitle}>İpucu Yaprakları</Text><View style={styles.productRow}>
          {visibleShopProducts("leaf").map((product) =>
            <Product key={product.productId} icon={product.icon} amount={String(product.amount)} price={storePrices[product.productId] ?? product.price}
              onPress={() => chooseProduct(product)} disabled={isPurchasing} />)}
        </View>
        <Text style={styles.groupTitle}>Koru Taşları</Text><View style={styles.productRow}>
          {visibleShopProducts("stone").map((product) =>
            <Product key={product.productId} icon={product.icon} amount={String(product.amount)} price={storePrices[product.productId] ?? product.price}
              onPress={() => chooseProduct(product)} disabled={isPurchasing} />)}
        </View>
        <Text style={styles.groupTitle}>Reklam Engelleme</Text>
        <View style={styles.removeAdsCard}>
          <View style={styles.removeAdsInfo}>
            <Text style={styles.removeAdsTitle}>Reklam Engelleme</Text>
            <Text style={styles.removeAdsCopy}>Zorunlu geçiş reklamlarını kalıcı olarak kapatır.</Text>
          </View>
          <Product icon={UI.shop} amount={save.adsRemoved ? "AKTİF" : "∞"} price={save.adsRemoved ? "AKTİF" : "₺149,99"}
            disabled={save.adsRemoved || isPurchasing}
            onPress={() => chooseProduct(SHOP_PRODUCTS_BY_ID.petalshift_remove_ads)} />
        </View>
        <TButton title={isRestoring ? "GERİ YÜKLENİYOR…" : "SATIN ALMALARI GERİ YÜKLE"} secondary onPress={restoreOwnedPurchases} />
        <Text style={styles.groupTitle}>Satın Alma Geçmişi</Text>
        <View style={styles.purchaseHistoryCard}>
          {save.purchaseHistory.length === 0
            ? <><Text style={styles.purchaseHistoryEmpty}>Henüz satın alma yok</Text><Text style={styles.purchaseHistoryNote}>Son satın almaların burada görünür.</Text></>
            : save.purchaseHistory.slice(-5).reverse().map((item) => {
              const date = new Date(item.purchasedAt);
              const dateLabel = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
              return <View key={item.id} style={styles.purchaseHistoryRow}>
                <View style={styles.purchaseHistoryInfo}>
                  <Text style={styles.purchaseHistoryTitle}>{item.title}</Text>
                  <Text style={styles.purchaseHistoryMeta}>{item.productId} · {dateLabel}</Text>
                </View>
                <View style={styles.purchaseHistoryPriceBox}>
                  <Text style={styles.purchaseHistoryAmount}>{item.amount === 1 && item.productId.includes("remove_ads") ? "∞" : item.amount}</Text>
                  <Text style={styles.purchaseHistoryPrice}>{item.price}</Text>
                </View>
              </View>;
            })}
        </View>
        {__DEV__ && !storeReady && <Text style={styles.shopNotice}>TEST MODU · GERÇEK ÖDEME ALINMAZ</Text>}</>}
    </View>
    {pendingPurchase && <View style={styles.purchaseConfirmOverlay}>
      <View style={styles.purchaseConfirmCard}>
        <View style={styles.hintConfirmOrnament} />
        <View style={styles.purchaseIconRing}>
          <Image source={pendingPurchase.icon} style={styles.purchaseIcon} resizeMode="contain" />
        </View>
        <Text style={styles.hintConfirmEyebrow}>PAKETİ ONAYLA</Text>
        <Text style={styles.hintConfirmTitle}>
          {pendingPurchase.currency === "removeAds" ? pendingPurchase.title : `${pendingPurchase.amount} ${pendingPurchase.title}`}
        </Text>
        <Text style={styles.hintConfirmCopy}>
          {pendingPurchase.currency === "removeAds"
            ? "Zorunlu geçiş reklamları bu cihazdaki kaydında kapatılacak. Satın alma işlemini onaylıyor musun?"
            : "Bu paket bakiyene eklenecek. Satın alma işlemini onaylıyor musun?"}
        </Text>
        <View style={styles.purchasePriceChip}><Text style={styles.purchasePrice}>{pendingPurchase.price}</Text></View>
        <TButton title={isPurchasing ? "Satın alma penceresi açılıyor…" : "SATIN ALMAYI ONAYLA"} onPress={confirmPurchase} />
        <TButton title="VAZGEÇ" secondary onPress={() => setPendingPurchase(null)} />
        {__DEV__ && <Text style={styles.purchaseTestNotice}>TEST MODU · GERÇEK ÖDEME ALINMAZ</Text>}
      </View>
    </View>}
    </View>
  </Modal>;
}

function Product({ icon, amount, price, onPress, disabled = false }: { icon: any; amount: string; price: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.product, pressed && styles.productPressed, disabled && styles.productDisabled]}>
    <Image source={icon} style={styles.productIcon} resizeMode="contain" />
    <Text style={styles.productAmount}>{amount}</Text>
    <Text style={styles.price}>{price}</Text>
    {!disabled && <Text style={styles.productTestLabel}>{__DEV__ ? "DOKUN · TEST AL" : "SATIN AL"}</Text>}
  </Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  languageScreen: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 24 },
  languageCard: { width: "100%", maxWidth: 390, borderRadius: 32, backgroundColor: "#FFF8E7F2", borderWidth: 3, borderColor: "#BDAA79", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, alignItems: "center", shadowColor: "#102A22", shadowOffset: { width: 0, height: 12 }, shadowOpacity: .28, shadowRadius: 12, elevation: 14 },
  languageLogo: { width: 92, height: 92, borderRadius: 24, borderWidth: 3, borderColor: "#FFF4D7" },
  languageBrand: { color: C.deep, fontSize: 12, fontWeight: "900", letterSpacing: 1.8, marginTop: 13 },
  languageTitle: { color: C.ink, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 29, fontWeight: "700", marginTop: 15 },
  languageSubtitle: { color: C.muted, fontSize: 13, fontWeight: "700", marginTop: 2, marginBottom: 17 },
  languageButton: { width: "100%", minHeight: 72, borderRadius: 21, backgroundColor: "#F4E9CE", borderWidth: 2, borderColor: "#CDBE91", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginTop: 9 },
  languageCode: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.green, borderWidth: 2, borderColor: "#D8E3BB", alignItems: "center", justifyContent: "center" },
  languageCodeEnglish: { backgroundColor: C.coral, borderColor: "#F4C9AF" },
  languageCodeText: { color: "#FFF8E7", fontSize: 13, fontWeight: "900", letterSpacing: .8 },
  languageButtonCopy: { flex: 1, marginLeft: 12 },
  languageButtonTitle: { color: C.ink, fontSize: 15, fontWeight: "900" },
  languageButtonSub: { color: C.muted, fontSize: 9, fontWeight: "700", marginTop: 3 },
  languageArrow: { color: C.deep, fontSize: 29, fontWeight: "700" },
  languageNote: { color: C.muted, fontSize: 9, fontWeight: "700", textAlign: "center", marginTop: 17 },
  languageNoteEnglish: { color: C.muted, fontSize: 9, fontWeight: "700", textAlign: "center", marginTop: 2 },
  background: { flex: 1, width: "100%", height: "100%" },
  backgroundWash: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(247,239,217,0.66)" },
  transparentRoot: { flex: 1, backgroundColor: "transparent" },
  splash: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "transparent" },
  splashLogo: { width: 154, height: 154, borderRadius: 38, borderWidth: 5, borderColor: "#FFF4D7" },
  practiceCompleteScreen: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, backgroundColor: "#173F35D9" },
  practiceCompleteCard: { width: "100%", maxWidth: 390, borderRadius: 32, backgroundColor: "#FFF8E7", borderWidth: 4, borderColor: "#E5C45A", paddingHorizontal: 20, paddingTop: 26, paddingBottom: 18, alignItems: "center", shadowColor: "#102A22", shadowOffset: { width: 0, height: 12 }, shadowOpacity: .35, shadowRadius: 12, elevation: 16 },
  practiceCompleteKicker: { color: C.coral, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  practiceCompleteTitle: { color: C.ink, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 27, lineHeight: 33, fontWeight: "700", textAlign: "center", marginTop: 7 },
  practiceCompleteCopy: { maxWidth: 310, color: C.muted, fontSize: 12, lineHeight: 18, fontWeight: "700", textAlign: "center", marginTop: 7 },
  practiceRoute: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  practiceRouteDone: { color: C.muted, fontSize: 8, fontWeight: "900" },
  practiceRouteArrow: { color: C.coral, fontSize: 17, fontWeight: "900" },
  practiceRouteNext: { color: C.deep, fontSize: 9, fontWeight: "900" },
  practiceCompleteGrid: { width: 218, aspectRatio: 1, flexDirection: "row", flexWrap: "wrap", gap: 5, padding: 7, borderRadius: 23, backgroundColor: "#657C5D", borderWidth: 4, borderColor: "#BDAE82", marginTop: 11, overflow: "hidden", shadowColor: "#20372A", shadowOffset: { width: 0, height: 6 }, shadowOpacity: .24, shadowRadius: 5, elevation: 7 },
  practiceCompleteCell: { width: 62, height: 62, borderRadius: 13, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  practiceCompleteCellImage: { borderRadius: 13 },
  practiceCompleteFlower: { width: 45, height: 45 },
  practiceCompletePill: { minHeight: 32, borderRadius: 16, backgroundColor: "#D8E3BB", borderWidth: 2, borderColor: "#FFFDF2", paddingHorizontal: 13, alignItems: "center", justifyContent: "center", marginTop: -8, marginBottom: 3 },
  practiceCompletePillText: { color: C.deep, fontSize: 9, fontWeight: "900", letterSpacing: .5 },
  practiceCompleteAuto: { color: C.muted, fontSize: 9, fontWeight: "700", marginTop: 9 },
  layerCelebrationScreen: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, backgroundColor: "#173F35E8" },
  layerCelebrationCard: { width: "100%", maxWidth: 390, borderRadius: 34, backgroundColor: "#FFF8E7", borderWidth: 4, borderColor: "#E5C45A", paddingHorizontal: 20, paddingTop: 25, paddingBottom: 18, alignItems: "center", overflow: "hidden", shadowColor: "#102A22", shadowOffset: { width: 0, height: 12 }, shadowOpacity: .38, shadowRadius: 13, elevation: 17 },
  layerCelebrationKicker: { color: C.coral, fontSize: 9, fontWeight: "900", letterSpacing: 1.7 },
  layerCelebrationTitle: { color: C.ink, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 32, fontWeight: "700", marginTop: 4 },
  layerCelebrationArt: { width: 220, height: 220, alignItems: "center", justifyContent: "center", marginTop: 5 },
  layerCelebrationFrame: { position: "absolute", width: 190, height: 198 },
  layerCelebrationGate: { width: 154, height: 168 },
  layerCelebrationSpark: { position: "absolute", width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  layerCelebrationSparkText: { color: C.gold, fontSize: 21, fontWeight: "900" },
  layerCelebrationName: { color: C.ink, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 24, fontWeight: "700", textAlign: "center", marginTop: -7 },
  layerCelebrationPill: { minHeight: 34, borderRadius: 17, backgroundColor: "#D8E3BB", borderWidth: 2, borderColor: "#FFFDF2", paddingHorizontal: 15, alignItems: "center", justifyContent: "center", marginTop: 8 },
  layerCelebrationPillText: { color: C.deep, fontSize: 9, fontWeight: "900", letterSpacing: .65 },
  layerCelebrationCopy: { color: C.muted, fontSize: 10, lineHeight: 15, fontWeight: "700", textAlign: "center", marginTop: 9, marginBottom: 1 },
  onboardingScreen: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
  onboardingTop: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  onboardingBrand: { color: C.deep, fontSize: 12, fontWeight: "900", letterSpacing: 1.3 },
  onboardingStepText: { color: C.muted, fontSize: 8, fontWeight: "900", marginTop: 2, letterSpacing: .7 },
  onboardingSkip: { minWidth: 58, minHeight: 34, borderRadius: 17, borderWidth: 1, borderColor: "#BDAA79", backgroundColor: "#FFF8E7CC", alignItems: "center", justifyContent: "center" },
  onboardingSkipText: { color: C.deep, fontSize: 9, fontWeight: "900" },
  onboardingScroll: { flexGrow: 1, paddingTop: 6, paddingBottom: 16 },
  onboardingPage: { width: "100%", alignItems: "center" },
  onboardingLogo: { width: 96, height: 96, borderRadius: 25, borderWidth: 3, borderColor: "#FFF4D7", marginTop: 8 },
  onboardingKicker: { color: C.coral, fontSize: 9, fontWeight: "900", letterSpacing: 1.6, marginTop: 8 },
  onboardingTitle: { color: C.ink, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 28, lineHeight: 34, fontWeight: "700", textAlign: "center", marginTop: 11 },
  onboardingCopy: { maxWidth: 370, color: C.muted, fontSize: 13, lineHeight: 20, fontWeight: "700", textAlign: "center", marginTop: 9 },
  onboardingRules: { width: "100%", maxWidth: 390, gap: 8, marginTop: 20 },
  onboardingRule: { minHeight: 66, borderRadius: 20, borderWidth: 1, borderColor: "#CDBE91", backgroundColor: "#FFF8E7E8", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 9 },
  onboardingRuleNumber: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.deep, borderWidth: 3, borderColor: "#D8E3BB", alignItems: "center", justifyContent: "center", marginRight: 11 },
  onboardingRuleNumberText: { color: "#FFF8E7", fontSize: 15, fontWeight: "900" },
  onboardingRuleTitle: { color: C.ink, fontSize: 12, fontWeight: "900" },
  onboardingRuleCopy: { color: C.muted, fontSize: 10, lineHeight: 14, fontWeight: "700", marginTop: 2 },
  onboardingCallout: { width: "100%", maxWidth: 360, borderRadius: 18, backgroundColor: "#E7EACB", borderLeftWidth: 5, borderLeftColor: C.green, paddingHorizontal: 14, paddingVertical: 11, marginTop: 14 },
  onboardingCalloutTitle: { color: C.deep, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  onboardingCalloutText: { color: C.muted, fontSize: 11, lineHeight: 16, fontWeight: "800", marginTop: 3 },
  targetDemo: { width: 220, alignItems: "center", marginTop: 18 },
  targetDemoGrid: { width: 210, aspectRatio: 1, flexDirection: "row", flexWrap: "wrap", gap: 4, padding: 6, borderRadius: 23, backgroundColor: "#657C5D", borderWidth: 4, borderColor: "#BDAE82", overflow: "hidden", shadowColor: "#20372A", shadowOffset: { width: 0, height: 6 }, shadowOpacity: .24, shadowRadius: 5, elevation: 7 },
  targetDemoCell: { width: 60, height: 60, borderRadius: 13, overflow: "hidden", borderWidth: 1, borderColor: "#FFF8E655", alignItems: "center", justifyContent: "center" },
  targetDemoImage: { borderRadius: 13, opacity: .34 },
  targetDemoFlower: { width: 43, height: 43 },
  targetDemoState: { position: "absolute", right: 2, top: 2, width: 19, height: 19, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFF8E7" },
  targetDemoCorrect: { backgroundColor: C.green },
  targetDemoWrong: { backgroundColor: C.coral },
  targetDemoStateText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  targetDemoLegend: { width: 210, minHeight: 34, borderRadius: 15, paddingHorizontal: 9, marginTop: -7, backgroundColor: "#FFF8E7", borderWidth: 1, borderColor: "#D5C79F", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  targetDemoLegendGood: { color: C.green, fontSize: 8, fontWeight: "900" },
  targetDemoLegendBad: { color: C.coral, fontSize: 8, fontWeight: "900" },
  wrapDemoArea: { minHeight: 250, width: "100%", alignItems: "center", justifyContent: "center", marginTop: 5 },
  wrapDemoArrow: { color: C.coral, fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginBottom: 12 },
  wrapDemoTrack: { position: "relative", overflow: "hidden", borderRadius: 23, borderWidth: 4, borderColor: "#BDAE82", backgroundColor: "#657C5D", shadowColor: "#20372A", shadowOffset: { width: 0, height: 6 }, shadowOpacity: .24, shadowRadius: 5, elevation: 7 },
  wrapDemoSoil: { position: "absolute", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#FFF8E655" },
  wrapDemoSoilImage: { opacity: .34, borderRadius: 12 },
  wrapDemoToken: { position: "absolute", alignItems: "center", justifyContent: "center" },
  wrapDemoFlower: { width: 43, height: 43 },
  onboardingFormula: { minHeight: 38, borderRadius: 19, backgroundColor: C.deep, borderWidth: 2, borderColor: "#739176", paddingHorizontal: 17, alignItems: "center", justifyContent: "center", marginTop: -16 },
  onboardingFormulaText: { color: "#FFF8E7", fontSize: 10, fontWeight: "900", letterSpacing: .8 },
  onboardingFinePrint: { maxWidth: 340, color: C.muted, fontSize: 11, lineHeight: 17, fontWeight: "800", textAlign: "center", marginTop: 13 },
  solvedDemo: { alignItems: "center", marginTop: 15 },
  solvedDemoTop: { width: 218, minHeight: 31, borderTopLeftRadius: 17, borderTopRightRadius: 17, backgroundColor: "#FFF8E7", borderWidth: 2, borderBottomWidth: 0, borderColor: "#BDAE82", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 11 },
  solvedDemoName: { color: C.deep, fontSize: 8, fontWeight: "900" },
  solvedDemoMove: { color: C.coral, fontSize: 8, fontWeight: "900" },
  solvedDemoGrid: { width: 218, aspectRatio: 1, flexDirection: "row", flexWrap: "wrap", gap: 5, padding: 8, borderRadius: 23, borderTopLeftRadius: 0, borderTopRightRadius: 0, backgroundColor: "#657C5D", borderWidth: 4, borderColor: "#BDAE82", overflow: "hidden", shadowColor: "#20372A", shadowOffset: { width: 0, height: 6 }, shadowOpacity: .24, shadowRadius: 5, elevation: 7 },
  solvedDemoCell: { width: 61, height: 61, borderRadius: 13, borderWidth: 1, borderColor: "#FFF8E655", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  solvedDemoCellImage: { borderRadius: 13, opacity: .34 },
  solvedDemoFlower: { width: 42, height: 42 },
  solvedDemoBadge: { minHeight: 34, borderRadius: 17, backgroundColor: C.green, borderWidth: 2, borderColor: "#D8E3BB", paddingHorizontal: 14, alignItems: "center", justifyContent: "center", marginTop: -9 },
  solvedDemoBadgeText: { color: "#FFF8E7", fontSize: 9, fontWeight: "900", letterSpacing: .7 },
  onboardingChecklist: { width: "100%", maxWidth: 360, gap: 6, marginTop: 16 },
  onboardingChecklistText: { color: C.deep, fontSize: 10, lineHeight: 15, fontWeight: "800", backgroundColor: "#FFF8E7C9", borderRadius: 13, paddingHorizontal: 11, paddingVertical: 7 },
  onboardingFooter: { paddingTop: 8, paddingBottom: 12, backgroundColor: "#F4E8CAD9" },
  onboardingDots: { height: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  onboardingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#AFA487" },
  onboardingDotActive: { width: 24, backgroundColor: C.deep },
  onboardingButtons: { flexDirection: "row", alignItems: "stretch", gap: 9 },
  onboardingBackButton: { width: 105 },
  mark: { backgroundColor: "#D8DFB9", alignItems: "center", justifyContent: "center", borderWidth: 6, borderColor: "#FFF4D7" },
  petal: { position: "absolute", backgroundColor: "#39745A" }, center: { position: "absolute", backgroundColor: C.gold },
  logoTitle: { marginTop: 25, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 34, fontWeight: "700", color: C.ink },
  subtitle: { color: C.muted, fontSize: 13, fontWeight: "700", marginTop: 5 },
  screen: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 24 },
  homeScreen: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 24 },
  levelsScreen: { flex: 1, paddingHorizontal: 18, paddingTop: 12 },
  levelList: { flex: 1, width: "100%" },
  levelListContent: { paddingTop: 2, paddingBottom: 42 },
  topRow: { minHeight: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balances: { flexDirection: "row", gap: 7 }, balance: { minHeight: 38, paddingHorizontal: 8, borderRadius: 18, backgroundColor: C.paper, borderWidth: 1, borderColor: "#CDBE91", flexDirection: "row", alignItems: "center", gap: 3 },
  currencyIcon: { width: 28, height: 28 }, balanceText: { fontSize: 12, fontWeight: "900", color: C.deep }, homeHero: { alignItems: "center", marginTop: 14 },
  homeLogo: { width: 82, height: 82, borderRadius: 22, borderWidth: 3, borderColor: "#FFF4D7" },
  homeTitle: { fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 33, fontWeight: "700", color: C.ink, marginTop: 14 },
  homeChapter: { minHeight: 150, marginTop: 18, marginBottom: 5, borderRadius: 26, borderWidth: 2, borderColor: "#809678", backgroundColor: "#FFF9E9E8", flexDirection: "row", alignItems: "center", padding: 12, shadowColor: "#50472F", shadowOffset: { width: 0, height: 5 }, shadowOpacity: .18, shadowRadius: 4, elevation: 5 },
  homeGate: { width: 124, height: 124 }, homeChapterInfo: { flex: 1, paddingLeft: 8 }, homeChapterEyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 1.3, color: C.coral },
  homeChapterTitle: { fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 21, fontWeight: "700", color: C.ink, marginTop: 4 },
  homeChapterLevel: { fontSize: 12, fontWeight: "800", color: C.muted, marginTop: 3 }, homeProgressVine: { width: "100%", height: 25, marginTop: 6 },
  preview: { height: 185, borderRadius: 30, marginVertical: 20, backgroundColor: "#96AD7E", borderWidth: 5, borderColor: "#F8EAC6", justifyContent: "center", alignItems: "center" },
  previewGrid: { width: 148, flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 24 },
  previewCell: { width: 46, height: 46, borderRadius: 13 },
  previewLabel: { position: "absolute", bottom: 11, backgroundColor: C.deep, color: "#FFF8E7", borderRadius: 15, paddingHorizontal: 14, paddingVertical: 7, fontSize: 10, fontWeight: "900" },
  bigButton: { width: "100%", minHeight: 59, backgroundColor: C.deep, borderRadius: 21, borderWidth: 2, borderColor: "#456F55", alignItems: "center", justifyContent: "center", marginTop: 9, shadowColor: "#102A22", shadowOffset: { width: 0, height: 6 }, shadowOpacity: .32, shadowRadius: 5, elevation: 8 },
  secondaryButton: { backgroundColor: "#F8EBCB", borderWidth: 2, borderColor: "#BDAA79" },
  bigButtonText: { color: "#FFF7DF", fontSize: 14, fontWeight: "900", letterSpacing: .5 }, pressed: { transform: [{ translateY: 3 }, { scale: .98 }], opacity: .9 },
  menuRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 }, menuButton: { width: "48%", height: 75, borderRadius: 20, backgroundColor: C.paper, borderWidth: 2, borderColor: "#D5C79F", alignItems: "center", justifyContent: "center", shadowColor: "#6A5B3C", shadowOffset: { width: 0, height: 4 }, shadowOpacity: .22, shadowRadius: 3, elevation: 5 },
  menuIconAsset: { width: 42, height: 42 }, menuLabel: { fontSize: 10, color: C.deep, fontWeight: "900", marginTop: 3 },
  companyBrand: { marginTop: 25, paddingTop: 12, paddingBottom: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderTopWidth: 1, borderTopColor: "#BDAA7966" },
  companyLogo: { width: 42, height: 42, borderRadius: 11 },
  companyName: { color: C.deep, fontSize: 12, fontWeight: "900", letterSpacing: 1.8 },
  assetIconButton: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  assetIconImage: { position: "absolute", width: "100%", height: "100%" },
  assetIconGlyph: { color: "#FFF4D7", fontSize: 21, fontWeight: "900" },
  badge: { position: "absolute", right: -2, top: -2, minWidth: 21, height: 21, borderRadius: 11, backgroundColor: C.gold, borderWidth: 2, borderColor: C.paper, alignItems: "center", justifyContent: "center", zIndex: 4 },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "900" }, pageTitle: { textAlign: "center", fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 29, fontWeight: "700", color: C.ink },
  freeHintBadge: { position: "absolute", right: -17, top: -12, minWidth: 51, height: 28, borderRadius: 14, backgroundColor: "#FFF8E7", borderWidth: 2, borderColor: "#E5C45A", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 5, zIndex: 6 },
  freeHintLabel: { color: C.green, fontSize: 5, fontWeight: "900", letterSpacing: .25, marginRight: 3 },
  freeHintCount: { color: C.deep, fontSize: 12, fontWeight: "900" },
  hintPriceBadge: { position: "absolute", right: -10, top: -7, height: 24, minWidth: 42, paddingHorizontal: 4, borderRadius: 12, backgroundColor: "#FFF8E7", borderWidth: 2, borderColor: "#BDAA79", flexDirection: "row", alignItems: "center", justifyContent: "center", zIndex: 5 },
  hintPriceIcon: { width: 18, height: 18 },
  hintPriceText: { color: C.deep, fontSize: 9, fontWeight: "900", marginLeft: -2 },
  pageCopy: { textAlign: "center", color: C.muted, fontSize: 12, fontWeight: "700", marginTop: 3 },
  layerTabs: { flexGrow: 0, marginHorizontal: -18, marginTop: 10 },
  layerTabsContent: { paddingHorizontal: 18, gap: 8, paddingBottom: 5 },
  layerTab: { width: 82, minHeight: 76, borderRadius: 18, backgroundColor: "#F5E9CC", borderWidth: 2, borderColor: "#CDBE91", alignItems: "center", justifyContent: "center", paddingHorizontal: 5, paddingVertical: 5 },
  layerTabSelected: { backgroundColor: C.deep, borderColor: "#739176" },
  layerTabLocked: { opacity: .52, borderColor: "#A99D7D" },
  layerTabSize: { color: C.ink, fontSize: 16, fontWeight: "900" },
  layerTabName: { color: C.muted, fontSize: 9, fontWeight: "900", marginTop: 1, maxWidth: 70 },
  layerTabColors: { color: C.green, fontSize: 7, fontWeight: "900", letterSpacing: .45, marginTop: 2 },
  layerTabProgress: { color: C.muted, fontSize: 8, fontWeight: "800", marginTop: 2 },
  layerTabTextSelected: { color: "#FFF5D8" },
  layerCard: { minHeight: 114, borderRadius: 24, backgroundColor: C.paper, borderWidth: 2, borderColor: "#6F916D", padding: 10, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 13, marginBottom: 12, shadowColor: "#615335", shadowOffset: { width: 0, height: 4 }, shadowOpacity: .18, shadowRadius: 3, elevation: 4 },
  lockedLayerCard: { backgroundColor: "#EEE5CFEF", borderColor: "#9B8E70" },
  gateFrame: { width: 96, height: 102, alignItems: "center", justifyContent: "center", padding: 7 },
  gateArt: { width: 79, height: 84 }, layerInfo: { flex: 1, paddingRight: 6 }, progressVine: { width: "100%", height: 25, marginTop: 3 },
  layerTitle: { fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 18, fontWeight: "700", color: C.ink }, layerCopy: { color: C.muted, fontSize: 10, fontWeight: "700", marginTop: 3 },
  layerLockedTitle: { color: C.coral, fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginTop: 3 },
  layerCostRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  layerCostIcon: { width: 23, height: 23 },
  layerCostText: { color: C.deep, fontSize: 11, fontWeight: "900" },
  layerUnlockButton: { minHeight: 29, marginTop: 4, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.deep, alignSelf: "flex-start", alignItems: "center", justifyContent: "center" },
  layerUnlockButtonText: { color: "#FFF7DF", fontSize: 9, fontWeight: "900" },
  levelTile: { width: "18.4%", aspectRatio: 1, margin: "0.8%", alignItems: "center", justifyContent: "center" },
  levelTileLocked: { opacity: .48 },
  levelTileAsset: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  levelText: { color: C.ink, fontSize: 13, fontWeight: "900", textAlign: "center" },
  levelTextLocked: { color: "#847A62", fontSize: 17 },
  levelMiniStars: { position: "absolute", bottom: 5, minWidth: 34, height: 13, borderRadius: 8, backgroundColor: "#FFF7DDEB", borderWidth: 1, borderColor: "#D3B965", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: -2, paddingHorizontal: 3, shadowColor: "#5C4A1B", shadowOffset: { width: 0, height: 1 }, shadowOpacity: .14, shadowRadius: 2, elevation: 2 },
  levelMiniStar: { width: 11, height: 11 },
  levelMiniStarEmpty: { opacity: .72 },
  levelLockMark: { position: "absolute", bottom: 6, color: "#756A52", fontSize: 5, fontWeight: "900", letterSpacing: .4 },
  levelCheck: { position: "absolute", width: 14, height: 14, right: 4, top: 5 },
  gameContainer: { flex: 1 },
  gameScreen: { flex: 1, paddingHorizontal: 10, paddingTop: 10, position: "relative" }, gameTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  navButtons: { flexDirection: "row", gap: 2 }, gameHeading: { flex: 1, alignItems: "center", marginHorizontal: 3 },
  gameTitle: { textAlign: "center", fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontWeight: "700", fontSize: 19, color: C.ink }, gameLevel: { textAlign: "center", fontSize: 10, fontWeight: "900", color: C.muted },
  moveCounter: { alignSelf: "center", backgroundColor: C.paper, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, marginTop: 12, color: C.ink, fontWeight: "900", fontSize: 11 },
  swipeGuide: { textAlign: "center", color: C.muted, fontSize: 11, fontWeight: "800", marginTop: 8 },
  horizontalControls: { flexDirection: "row", justifyContent: "space-around", height: 34, alignItems: "center" }, verticalControls: { width: 34, justifyContent: "space-around", alignItems: "center" },
  boardRow: { flexDirection: "row", alignItems: "center" }, board: { flexDirection: "row", flexWrap: "wrap", padding: 5, gap: 5, backgroundColor: "#657C5D", borderRadius: 24, borderWidth: 4, borderColor: "#BDAE82", overflow: "hidden", shadowColor: "#20372A", shadowOffset: { width: 0, height: 7 }, shadowOpacity: .25, shadowRadius: 5, elevation: 8 },
  plot: { borderRadius: 14, borderWidth: 1, borderColor: "#FFF8E655", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  soilTexture: { opacity: .58 },
  tokenSlot: { position: "absolute", alignItems: "center", justifyContent: "center", zIndex: 8 },
  tokenSlotLifted: { zIndex: 18 },
  tokenCenter: { position: "absolute", backgroundColor: "#F0C95A", borderWidth: 1, borderColor: "#A77B32" },
  completionFx: { ...StyleSheet.absoluteFillObject, zIndex: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF3B522" },
  completionHalo: { minWidth: 142, minHeight: 112, borderRadius: 70, backgroundColor: "#FFF8DDEA", borderWidth: 5, borderColor: "#E5C45A", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  completionStar: { color: C.gold, fontSize: 42, lineHeight: 45, fontWeight: "900" },
  completionLabel: { color: C.deep, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  completionParticle: { position: "absolute", width: 9, height: 9, borderRadius: 5, backgroundColor: "#F4D86F", borderWidth: 2, borderColor: "#FFF9DC" },
  frameRailH: { position: "absolute", zIndex: 3, opacity: .32 }, frameRailV: { position: "absolute", zIndex: 3, opacity: .32 },
  wind: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  windAsset: { position: "absolute", width: 38, height: 38 },
  windText: { color: "#FFF4D7", fontSize: 18, fontWeight: "900", zIndex: 2 }, gameActions: { flexDirection: "row", justifyContent: "center", gap: 22, marginTop: 15 },
  interactionLock: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: "transparent" },
  gestureSurface: { ...StyleSheet.absoluteFillObject, zIndex: 30, backgroundColor: "transparent" },
  levelTransition: { ...StyleSheet.absoluteFillObject, zIndex: 300, alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: "#173F35E8" },
  levelTransitionVeil: { position: "absolute", width: Math.max(width, height) * 1.35, height: Math.max(width, height) * 1.35, borderRadius: Math.max(width, height), backgroundColor: "#6F916D", borderWidth: 28, borderColor: "#D8E3BB66" },
  levelTransitionCard: { minWidth: 220, minHeight: 160, borderRadius: 34, backgroundColor: "#FFF8E7F5", borderWidth: 4, borderColor: "#E5C45A", alignItems: "center", justifyContent: "center", paddingHorizontal: 28, shadowColor: "#102A22", shadowOffset: { width: 0, height: 12 }, shadowOpacity: .35, shadowRadius: 12, elevation: 18 },
  levelTransitionEyebrow: { color: C.coral, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  levelTransitionTitle: { color: C.ink, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 30, fontWeight: "700", marginTop: 5 },
  levelTransitionLine: { width: 66, height: 3, borderRadius: 2, backgroundColor: C.gold, marginVertical: 11 },
  levelTransitionCopy: { color: C.deep, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  starRewardCard: { width: "100%", maxWidth: 390, borderRadius: 34, backgroundColor: "#FFF8E8F8", borderWidth: 3, borderColor: "#D8B85D", paddingHorizontal: 18, paddingTop: 26, paddingBottom: 18, alignItems: "center", overflow: "hidden", shadowColor: "#1B382D", shadowOffset: { width: 0, height: 14 }, shadowOpacity: .28, shadowRadius: 16, elevation: 18 },
  starRewardOrnament: { position: "absolute", top: -82, width: 260, height: 145, borderRadius: 130, backgroundColor: "#E9E1BD", borderWidth: 3, borderColor: "#FFF9DF" },
  rewardKicker: { color: C.coral, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, marginTop: 4, textAlign: "center" },
  rewardTitle: { fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 34, fontWeight: "700", color: C.ink, marginTop: 7 },
  starRow: { height: 112, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 14, marginBottom: 1 },
  starSlot: { width: 92, height: 92, alignItems: "center", justifyContent: "center", marginHorizontal: -3 },
  starSlotCenter: { width: 108, height: 108, marginTop: -12, zIndex: 3 },
  starGlow: { position: "absolute", width: 72, height: 72, borderRadius: 36, backgroundColor: "#FFE89A", opacity: .44, shadowColor: "#FFCF35", shadowOffset: { width: 0, height: 0 }, shadowOpacity: .85, shadowRadius: 16 },
  rewardStarIcon: { width: "100%", height: "100%" },
  starDivider: { flexDirection: "row", alignItems: "center", width: "72%", marginVertical: 2 },
  starDividerLine: { flex: 1, height: 1, backgroundColor: "#C8B27B" },
  starDividerLeaf: { color: "#8A9D6A", fontSize: 12, marginHorizontal: 10 },
  rewardStatsCard: { width: "48%", minHeight: 68, borderRadius: 18, backgroundColor: "#F4E8CE", borderWidth: 1, borderColor: "#D8C596", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12 },
  rewardStat: { flex: 1, alignItems: "center", justifyContent: "center" },
  rewardStatSep: { width: 1, height: 42, backgroundColor: "#C8B27B" },
  rewardStatLabel: { color: C.deep, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  rewardStatValue: { color: C.ink, fontSize: 25, fontWeight: "900", marginTop: 2 },
  rewardBloom: { width: 155, height: 155, borderRadius: 80, backgroundColor: "#D8E3BB", alignItems: "center", justifyContent: "center", marginVertical: 24, borderWidth: 10, borderColor: "#FFF4D1" },
  rewardCopy: { color: C.muted, fontWeight: "800", marginTop: 8, marginBottom: 12 },
  rewardSectionTitle: { color: C.deep, fontSize: 11, fontWeight: "900", letterSpacing: 1.9, marginBottom: 9 },
  rewardCurrencyPanel: { width: "100%", alignItems: "center", marginTop: 4 },
  rewardCurrencyGrid: { width: "78%", flexDirection: "row", justifyContent: "center", gap: 20 },
  rewardCurrencyBox: { width: 94, minHeight: 98, alignItems: "center", justifyContent: "center", backgroundColor: "#FDF4DC", borderRadius: 18, borderWidth: 1, borderColor: "#D8C596", paddingVertical: 8 },
  rewardCurrencyCard: { width: "100%", minHeight: 82, flexDirection: "row", alignItems: "center", backgroundColor: C.paper, borderRadius: 22, borderWidth: 2, borderColor: "#CDBE91", paddingHorizontal: 12, paddingVertical: 9, marginBottom: 9 },
  rewardCurrencyIcon: { width: 54, height: 54 },
  rewardCurrencyInfo: { flex: 1, marginLeft: 7 },
  rewardCurrencyName: { color: C.ink, fontSize: 14, fontWeight: "900" },
  rewardCurrencyNumbers: { alignItems: "flex-end", minWidth: 72 },
  rewardGain: { color: C.green, fontSize: 19, fontWeight: "900" },
  rewardBalance: { color: C.muted, fontSize: 10, fontWeight: "800", marginTop: 2 },
  rewardContinueReveal: { width: "100%" },
  rewardRow: { flexDirection: "row", gap: 12, marginVertical: 22 },
  rewardChip: { backgroundColor: C.paper, borderRadius: 18, paddingVertical: 13, paddingHorizontal: 21, fontWeight: "900", color: C.ink },
  rewardHome: { alignSelf: "flex-start", marginBottom: -38 },
  hintConfirmBackdrop: { flex: 1, backgroundColor: "#173F3599", alignItems: "center", justifyContent: "center", padding: 22 },
  hintConfirmCard: { width: "100%", maxWidth: 380, borderRadius: 30, backgroundColor: "#FFF8E7", borderWidth: 3, borderColor: "#BDAA79", paddingHorizontal: 22, paddingTop: 28, paddingBottom: 20, alignItems: "center", overflow: "hidden", shadowColor: "#102A22", shadowOffset: { width: 0, height: 12 }, shadowOpacity: .35, shadowRadius: 12, elevation: 14 },
  hintConfirmOrnament: { position: "absolute", top: -72, width: 230, height: 126, borderRadius: 120, backgroundColor: "#D8E3BB" },
  hintConfirmIconRing: { width: 92, height: 92, borderRadius: 46, backgroundColor: "#EEF0D1", borderWidth: 5, borderColor: "#FFFDF2", alignItems: "center", justifyContent: "center" },
  hintConfirmIcon: { width: 70, height: 70 },
  reviewPromptIcon: { width: 70, height: 70, borderRadius: 18 },
  hintConfirmEyebrow: { color: C.coral, fontSize: 9, fontWeight: "900", letterSpacing: 1.4, marginTop: 15 },
  hintConfirmTitle: { color: C.ink, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 24, fontWeight: "700", marginTop: 5, textAlign: "center" },
  hintConfirmCopy: { color: C.muted, fontSize: 12, lineHeight: 18, fontWeight: "700", textAlign: "center", marginTop: 9 },
  hintCostRow: { width: "100%", minHeight: 50, borderRadius: 17, backgroundColor: "#F2E8CE", borderWidth: 1, borderColor: "#D5C79F", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, marginTop: 16, marginBottom: 3 },
  hintCostChip: { flexDirection: "row", alignItems: "center" },
  hintCostIcon: { width: 34, height: 34 },
  hintCostText: { color: C.coral, fontSize: 17, fontWeight: "900", marginLeft: 2 },
  hintBalanceText: { color: C.deep, fontSize: 11, fontWeight: "900" },
  modalBackdrop: { flex: 1, backgroundColor: "#173F3577", justifyContent: "flex-end", padding: 14 },
  sheet: { maxHeight: "90%", backgroundColor: C.paper, borderRadius: 29, padding: 22 }, sheetClose: { position: "absolute", zIndex: 2, right: 18, top: 18, width: 36, height: 36, borderRadius: 18, backgroundColor: "#E7DCC2", alignItems: "center", justifyContent: "center" },
  sheetTitle: { fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 25, fontWeight: "700", color: C.ink }, sheetCopy: { color: C.muted, fontSize: 12, fontWeight: "700", marginTop: 7, marginRight: 35 },
  confirmRow: { flexDirection: "row", gap: 10, marginTop: 18 }, setting: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 56, borderBottomWidth: 1, borderBottomColor: "#DED3BB" },
  languageSetting: { alignItems: "flex-start", paddingVertical: 10 },
  settingsLanguageOptions: { flexDirection: "row", gap: 7 },
  settingsLanguageButton: { minWidth: 72, minHeight: 36, borderRadius: 18, borderWidth: 1, borderColor: "#CDBE91", backgroundColor: "#F4E9CE", alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  settingsLanguageButtonSelected: { backgroundColor: C.deep, borderColor: "#739176" },
  settingsLanguageText: { color: C.deep, fontSize: 10, fontWeight: "900" },
  settingsLanguageTextSelected: { color: "#FFF8E7" },
  settingText: { fontWeight: "800", color: C.ink }, groupTitle: { marginTop: 18, marginBottom: 9, fontWeight: "900", color: C.ink }, productRow: { flexDirection: "row", gap: 8 },
  shopBalance: { alignItems: "flex-start", marginTop: 14 },
  shopNotice: { color: C.coral, fontSize: 8, fontWeight: "900", letterSpacing: .9, textAlign: "center", marginTop: 15 },
  storeStatusText: { color: C.green, fontSize: 9, fontWeight: "800", textAlign: "center", lineHeight: 13, marginTop: 8 },
  iosStoneNotice: { backgroundColor: "#FFF8E7", borderRadius: 18, borderWidth: 1, borderColor: "#D5C79F", paddingHorizontal: 12, paddingVertical: 11, marginTop: 8 },
  iosStoneNoticeText: { color: C.muted, fontSize: 10, fontWeight: "800", textAlign: "center", lineHeight: 15 },
  product: { flex: 1, backgroundColor: "#EFE5CE", borderRadius: 18, borderWidth: 1, borderColor: "#D5C79F", padding: 9, alignItems: "center" },
  productPressed: { transform: [{ scale: .96 }], backgroundColor: "#E0D5B9" },
  productDisabled: { opacity: .7, backgroundColor: "#D8E3BB" },
  productIcon: { width: 42, height: 42 },
  productAmount: { fontSize: 11, fontWeight: "900", marginVertical: 5, color: C.ink }, price: { backgroundColor: C.green, color: "#fff", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, fontSize: 7, fontWeight: "900" },
  productTestLabel: { color: C.coral, fontSize: 5, fontWeight: "900", letterSpacing: .25, marginTop: 5 },
  removeAdsCard: { flexDirection: "row", alignItems: "stretch", gap: 10, backgroundColor: "#FFF8E7", borderRadius: 20, borderWidth: 1, borderColor: "#D5C79F", padding: 10 },
  removeAdsInfo: { flex: 2, justifyContent: "center" },
  removeAdsTitle: { color: C.ink, fontSize: 15, fontWeight: "900" },
  removeAdsCopy: { color: C.muted, fontSize: 10, fontWeight: "700", marginTop: 4, lineHeight: 15 },
  purchaseHistoryCard: { backgroundColor: "#FFF8E7", borderRadius: 18, borderWidth: 1, borderColor: "#D5C79F", padding: 10 },
  purchaseHistoryEmpty: { color: C.ink, fontSize: 12, fontWeight: "900", textAlign: "center" },
  purchaseHistoryNote: { color: C.muted, fontSize: 9, fontWeight: "700", textAlign: "center", marginTop: 3 },
  purchaseHistoryRow: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, backgroundColor: "#F1E7CE", paddingHorizontal: 10, paddingVertical: 8, marginBottom: 7 },
  purchaseHistoryInfo: { flex: 1, paddingRight: 8 },
  purchaseHistoryTitle: { color: C.ink, fontSize: 12, fontWeight: "900" },
  purchaseHistoryMeta: { color: C.muted, fontSize: 8, fontWeight: "700", marginTop: 2 },
  purchaseHistoryPriceBox: { alignItems: "flex-end", minWidth: 64 },
  purchaseHistoryAmount: { color: C.green, fontSize: 14, fontWeight: "900" },
  purchaseHistoryPrice: { color: C.deep, fontSize: 9, fontWeight: "900", marginTop: 1 },
  purchaseConfirmOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 20, backgroundColor: "#173F35B8", alignItems: "center", justifyContent: "center", padding: 22 },
  purchaseConfirmCard: { width: "100%", maxWidth: 370, borderRadius: 30, backgroundColor: "#FFF8E7", borderWidth: 3, borderColor: "#BDAA79", paddingHorizontal: 22, paddingTop: 26, paddingBottom: 18, alignItems: "center", overflow: "hidden", shadowColor: "#102A22", shadowOffset: { width: 0, height: 12 }, shadowOpacity: .35, shadowRadius: 12, elevation: 18 },
  purchaseIconRing: { width: 94, height: 94, borderRadius: 47, backgroundColor: "#EEF0D1", borderWidth: 5, borderColor: "#FFFDF2", alignItems: "center", justifyContent: "center" },
  purchaseIcon: { width: 72, height: 72 },
  purchasePriceChip: { minWidth: 116, minHeight: 42, borderRadius: 21, backgroundColor: C.green, borderWidth: 2, borderColor: "#739176", alignItems: "center", justifyContent: "center", marginTop: 15, marginBottom: 2, paddingHorizontal: 18 },
  purchasePrice: { color: "#FFF8E7", fontSize: 16, fontWeight: "900" },
  purchaseTestNotice: { color: C.coral, fontSize: 7, fontWeight: "900", letterSpacing: .8, marginTop: 10 },
  toast: { position: "absolute", alignSelf: "center", bottom: 28, backgroundColor: C.deep, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 11 }, toastText: { color: "#FFF8E7", fontSize: 11, fontWeight: "900" },
});
