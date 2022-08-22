/*
 * @Author: error: git config user.name && git config user.email & please set dead value or install git
 * @Date: 2022-08-19 11:47:45
 * @LastEditors: error: git config user.name && git config user.email & please set dead value or install git
 * @LastEditTime: 2022-08-22 18:04:57
 * @FilePath: /react-drag-resizable/src/react-drag-resizable/types.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export type Direction =
  | 'left_top'
  | 'left_bottom'
  | 'right_top'
  | 'right_bottom'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'content';

export type CurrentStateType = | 'moving' | 'trans' | 'silence'

export type CollectedRectType = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type LimitType = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type RectType = Partial<CollectedRectType>;
export type CalcRectType = CollectedRectType;
export type AllBoxRectCollectorType = CollectedRectType & LimitType;
export type PositionType = LimitType;
export interface BaseDragResizableBoxPropsProps {
  /**
   * @description  限制位移界限的坐标值
   */
  limit: LimitType;
  /**
   * @description style中rect属性的语法糖，可传入width、height、left、top
   */
  rect: RectType;
  /**
   * @argument 参数rect为改变后的left、top、width、height
   * @description 传入onChange会使组件受控，需要传入left、top和width、height
   */
  onChange: (rect: CollectedRectType) => void;
  onClick: (e:MouseEvent) => void;
  /**
   * @default false
   * @description   默认移动位置时相对于 document，如果需要相对于父盒子，请设置为 true
   */
  relative: boolean;
  /**
   * @default 10
   * @description 最小宽度
   */
  minWidth: number;
  /**
   * @default 10
   * @description 最小高度
   */
  minHeight: number;
  /**
   * @default true
   * @description 是否展示辅助线
   */
  guides: boolean;
  /**
   * @default true
   * @description 是否需要磁吸效果
   */
  adsorb?: boolean;
  /**
   * @default 3
   * @description 接近多少距离时触发红线
   */
  diff: number;
  /**
   * @description 辅助线颜色
   */
  guidesColor: React.CSSProperties['color'];
  /**
   * @description 小方块的className
   */
  rectClassName: string;
  /**
   * @default true
   * @description limit开启后是否在拖动的时候出边界，当鼠标UP后回到Limit边界内
   */
  limitUpBack?: boolean
  /**
   * @default false
   * @description 当被拖动的时候，是否有选区
   */
  Selection?: boolean
  /**
   * @argument 参数rect为改变后的left、top、width、height
   * @description 当发生拖拽过程中
   */
  onDrag?: (rect: CollectedRectType) => void;
  /**
   * @argument 参数rect为改变后的left、top、width、height
   * @description 当发生拖拽开始
   */
  onDragStart?: (rect: CollectedRectType) => void;
  /**
   * @argument 参数rect为改变后的left、top、width、height
   * @description 当发生拖拽结束
   */
  onDragEnd?: (rect: CollectedRectType) => void;
  /**
   * @argument 参数rect为改变后的left、top、width、height
   * @description 当发生变形拖拽
   */
  onTrans?: (rect: CollectedRectType) => void;
  /**
   * @argument 参数rect为改变后的left、top、width、height
   * @description 当发生变形开始
   */
  onTransStart?: (rect: CollectedRectType) => void;
  /**
   * @argument 参数rect为改变后的left、top、width、height
   * @description 当发生变形结束
   */
  onTransEnd?: (rect: CollectedRectType) => void;
  /**
   * @argument 
   * @description 只读是否被激活
   */
  isActivied?:boolean,
  /**
   * @argument
   * @description 当被激活点击时
   */
  onActive?: () => void,
  /**
   * @argument 缩放比 0.5 < rate <= 2
   * @description 当被激活点击时
   */
  rate?:number
}

export type DragResizableBoxProps = Partial<
  BaseDragResizableBoxPropsProps &
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>
>;
