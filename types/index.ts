export interface MachineRecord {
  id: string;
  productName: string;    // 製品名
  contentVolume: string;  // 内容量
  packType: string;       // パック形態
  machineNumber: string;  // 機械番号
  settingsMemo: string;   // 設定値メモ
  photoUrl: string;       // 写真（Base64）
  registeredAt: string;   // 登録日時（ISO string）
}
