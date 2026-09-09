/**
 * 创建编辑页与后端协议之间的唯一边界。接口确定后由业务模块提供实现，
 * 共享参数编辑器不感知 URL、响应结构或保存提示。
 */
export interface DefinitionEditorAdapter<TValue, TDetail = TValue> {
  load(id: number): Promise<TDetail>;
  create(value: TValue): Promise<void>;
  update(id: number, value: TValue): Promise<void>;
}
