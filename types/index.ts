export interface MachineRecord {
  id: string;
  productName: string;       // 製品名
  contentVolume: string;     // 内容量
  packType: string;          // パック形態
  machineName: string;       // 機械名
  lineName: string;          // ライン名
  photoUrl: string;          // 写真URL
  sealTemp: string;          // シール温度
  fillTemp: string;          // 充填温度
  speed: string;             // スピード
  printSettings: string;     // 印字設定
  otherSettings: string;     // その他設定値
  notes: string;             // 注意点
  remarks: string;           // 備考
  registeredAt: string;      // 登録日 (ISO string)
  registeredBy: string;      // 登録者
}

export interface ProductSummary {
  productName: string;
  contentVolumes: string[];
  machineNames: string[];
  latestDate: string;
  latestPhotoUrl: string;
  count: number;
}
