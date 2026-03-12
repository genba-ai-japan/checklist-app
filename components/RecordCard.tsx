"use client";

import Link from "next/link";
import Image from "next/image";
import { MachineRecord } from "@/types";

interface Props {
  record: MachineRecord;
}

export default function RecordCard({ record }: Props) {
  const dateStr = new Date(record.registeredAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <Link href={`/item/${record.id}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform">
        <div className="flex">
          {/* サムネイル */}
          <div className="w-24 h-24 flex-shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden">
            {record.photoUrl ? (
              <Image
                src={record.photoUrl}
                alt="設定写真"
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-3xl">📷</span>
            )}
          </div>

          {/* テキスト情報 */}
          <div className="flex-1 p-3 min-w-0">
            <p className="text-lg font-bold text-gray-900 truncate">{record.productName}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge color="blue">{record.contentVolume}</Badge>
              <Badge color="green">{record.machineName}</Badge>
              {record.packType && <Badge color="gray">{record.packType}</Badge>}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span>{dateStr}</span>
              <span>·</span>
              <span>{record.registeredBy}</span>
            </div>
            {record.lineName && (
              <p className="text-xs text-gray-400 mt-0.5">{record.lineName}</p>
            )}
          </div>
          <div className="flex items-center pr-3 text-gray-300">›</div>
        </div>
      </div>
    </Link>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "blue" | "green" | "gray";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[color]}`}>
      {children}
    </span>
  );
}
