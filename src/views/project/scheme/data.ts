export interface SchemeItem {
  /** 仅用作表格行标识，不作为业务编号展示。 */
  id: string;
  name: string;
  description: string;
  project: string;
  owner: string;
  version: string;
  updated: string;
}

const templates = [
  {
    name: "倾斜摄影三维建模方案",
    project: "华东城市实景三维",
    description: "覆盖影像采集、空三加密、三维重建及成果质量检查。"
  },
  {
    name: "数字高程模型生产方案",
    project: "西南地形测量项目",
    description: "完成地形数据采集、地面点分类和数字高程模型生产。"
  },
  {
    name: "正射影像更新方案",
    project: "沿海港口影像更新",
    description: "开展影像纠正、色彩均衡、镶嵌裁切及变化区域复核。"
  },
  {
    name: "激光点云质量检查方案",
    project: "重点区域点云质检",
    description: "检查点云密度、分类精度与高程异常，形成质量报告。"
  },
  {
    name: "地下管线数据整编方案",
    project: "地下管网普查",
    description: "统一管线编码、坐标基准和属性字段，完成拓扑检查。"
  },
  {
    name: "河道遥感监测方案",
    project: "河道遥感调查",
    description: "提取河道边界与岸线变化，制作监测专题成果。"
  }
];
const owners = ["陈思远", "王雨晴", "林晓明", "赵子涵"];

/** 本地演示数据，不连接或写入业务接口。 */
export const mockSchemes: SchemeItem[] = Array.from(
  { length: 24 },
  (_, index) => {
    const template = templates[index % templates.length];
    const batch = Math.floor(index / templates.length) + 1;
    return {
      id: `mock-scheme-${index + 1}`,
      name: `${template.name}（第${batch}期）`,
      description: template.description,
      project: template.project,
      owner: owners[index % owners.length],
      version: `V${batch}.${index % 3}`,
      updated: `2026-08-${String(30 - index).padStart(2, "0")} 10:30:00`
    };
  }
);
