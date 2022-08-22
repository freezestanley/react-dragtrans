import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
  MouseEventHandler,
} from 'react';
import classNames from 'classnames';
import '../index.css';
import { Wrap } from './style';
import type {
  AllBoxRectCollectorType,
  CalcRectType,
  CollectedRectType,
  Direction,
  DragResizableBoxProps,
  LimitType,
  PositionType,
  RectType,
  CurrentStateType
} from './types';

function getCoords(elem: Element) {
  const rect = elem.getBoundingClientRect();
  let left = window.pageXOffset + rect.left;
  let right = window.pageXOffset + rect.right;
  let top = window.pageYOffset + rect.top;
  let bottom = window.pageYOffset + rect.bottom;
  return {
    left,
    right,
    top,
    bottom,
  };
}

const initCollector = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  right: 0,
  bottom: 0,
  pointX: 0,
  pointY: 0,
  shiftX: 0,
  shiftY: 0,
};
const DragResizableBox: React.FC<
  React.PropsWithChildren<DragResizableBoxProps>
> = React.memo((props) => {
  let {
    style,
    className,
    onClick,
    onChange,
    onDrag,
    onDragStart,
    onDragEnd,
    onTrans,
    onTransStart,
    onTransEnd,
    isActivied,
    onActive,
    limit,
    relative,
    rect,
    minWidth = 20,
    minHeight = 20,
    diff = 3,
    guidesColor = 'rgb(248, 54, 33)',
    rectClassName,
    adsorb = true,
    guides = true,
    limitUpBack = false,
    Selection = true,
    rate = 1,
    // onClick,
    ...restProps
  } = props;

  //缩放比例  2 > rate >= 0.5 
  rate = rate < 0.5 ? 0.5 : rate > 2 ? 2 : rate
  //a 缩放比 b 移动值 c 结果值
  /**
   * @description: val 移动值 rate 缩放比
   * @param {number} val
   * @param {number} rate
   * @return {*}
   */  
  function getRate (val: number,rate: number) {
    let result = rate < 1 ? val / rate : val * rate
    return result
  }
  function getRate1 (val: number,rate: number) {
    let result = rate > 1 ? val / rate : val * rate
    return result
  }



  const [currentType, setCurrentType] = useState<CurrentStateType>('silence')
  //允许缩放
  const [allowResize, setAllowResize] = useState(false);
  const [active, setActive] = useState(false)
  

  //box的ref
  const box = useRef<HTMLDivElement | null>(null);
  //方块的属性值
  const [rectAttr, setRectAttr] = useState<RectType>({} as RectType);
  //收集所有区域内的box
  const allBoxRectCollector = useRef<AllBoxRectCollectorType[]>([]);
  // 辅助线
  const line_n = useRef<HTMLDivElement>(null);
  const line_e = useRef<HTMLDivElement>(null);
  const line_s = useRef<HTMLDivElement>(null);
  const line_w = useRef<HTMLDivElement>(null);
  const line_mdx = useRef<HTMLDivElement>(null);
  const line_mdy = useRef<HTMLDivElement>(null);
  // 方向
  const direction = useRef<Direction>('left');
  // 用来记录鼠标点下去时元素的属性值
  const collector = useRef(initCollector);
  // 判断是否贴近
  const isNearly = useCallback(
    (value1: number, value2: number) => {
      return Math.abs(value1 - value2) <= diff;
    },
    [diff],
  );
  // 显示线
  const showLine = useCallback((whichLine: React.RefObject<HTMLDivElement>) => {
    whichLine.current!.style.display = 'flex'
  }, []);
  // 隐藏线 
  const hiddenLine = useCallback(() => {
    [line_n, line_e, line_s, line_w, line_mdx, line_mdy].forEach((line) => {
      line.current!.style.display = 'none'
    });
  }, []);
  /**
   *
   * @param collectorRect 当mousedown 时收集到的rect属性
   * @param offsetInfo mousedown 时鼠标位置与 mousemove 时鼠标位置的偏移量、mousedown 时鼠标位置与盒子left 处、top 处的偏差值
   * @param e 事件对象
   * @returns 计算得出盒模型mousemove 后的left、width、top、height 结果
   */
  const handleCalcRect = useCallback(
    (
      collectorRect: CollectedRectType,
      offsetInfo: {
        offsetX: number;
        offsetY: number;
        shiftX: number;
        shiftY: number;
      },
      e: MouseEvent,
    ): CalcRectType => {
      let { left, top, width, height } = collectorRect;
      let { offsetX, offsetY, shiftX, shiftY } = offsetInfo;
      switch (direction.current) {
        case 'left_top':
          left = Math.min(left + width - minWidth, left - offsetX);
          top = Math.min(top + height - minHeight, top - offsetY);
          width = width + offsetX;
          height = height + offsetY;
          break;
        case 'left_bottom':
          left = Math.min(left + width - minWidth, left - offsetX);
          width = width + offsetX;
          height = height - offsetY;
          break;
        case 'right_top':
          top = Math.min(top + height - minHeight, top - offsetY);
          width = width - offsetX;
          height = height + offsetY;
          break;
        case 'right_bottom':
          width = width - offsetX;
          height = height - offsetY;
          break;
        case 'top':
          top = Math.min(top + height - minHeight, top - offsetY);
          height = height + offsetY;
          break;
        case 'bottom':
          height = height - offsetY;
          break;
        case 'left':
          left = Math.min(left + width - minWidth, left - offsetX);
          width = width + offsetX;
          break;
        case 'right':
          width = width - offsetX;
          break;
        case 'content':
          left = getRate(e.pageX, rate) - shiftX;
          top = getRate(e.pageY, rate) - shiftY;
          break;
      }
      return { width, height, left, top };
    },
    [],
  );

  /**
   * handle position limit
   * @param rect mousemove 后的left、width、top、height 结果
   * @param limit 用来限制拖动范围的界限坐标
   * @returns  计算limit 条件限制后得出的left、width、top、height 结果
   */
  const handleLimit = useCallback(
    (rect: CollectedRectType, limit: LimitType): CalcRectType => {
      let { left, top, width, height } = rect;
      switch (direction.current) {
        case 'content':
          if (left < limit.left) {
            left = limit.left;
          }
          if (left > limit.right - width) {
            left = limit.right - width;
          }
          if (top < limit.top) {
            top = limit.top;
          }
          if (top > limit.bottom - height) {
            top = limit.bottom - height;
          }
          break;
        case 'left_top':
          if (top < limit.top) {
            top = limit.top;
          }
          if (left < limit.left) {
            left = limit.left;
          }
          break;
        case 'top':
          if (top < limit.top) {
            top = limit.top;
          }
          break;
        case 'right_top':
          if (top < limit.top) {
            top = limit.top;
          }
          if (width + left > limit.right) {
            left = Math.max(limit.left, left - (width + left - limit.right));
          }
          break;
        case 'right':
          if (left + width > limit.right) {
            left = Math.max(limit.left, left - (left + width - limit.right));
          }
          break;
        case 'right_bottom':
          if (left + width > limit.right) {
            left = Math.max(limit.left, left - (left + width - limit.right));
          }
          if (top + height > limit.bottom) {
            top = Math.max(limit.top, top - (top + height - limit.bottom));
          }
          break;
        case 'bottom':
          if (top + height > limit.bottom) {
            top = Math.max(limit.top, top - (top + height - limit.bottom));
          }
          break;
        case 'left_bottom':
          if (left < limit.left) {
            left = limit.left;
          }
          if (top + height > limit.bottom) {
            top = Math.max(limit.top, top - (top + height - limit.bottom));
          }
          break;
        case 'left':
          if (left < limit.left) {
            left = limit.left;
          }
          break;
      }
      if (width > limit.right - limit.left) {
        width = limit.right - limit.left;
      }
      if (height > limit.bottom - limit.top) {
        height = limit.bottom - limit.top;
      }
      return { width, height, left, top };
    },
    [],
  );
  /**
   *  handle guidess base on curCalcRect after handleLimit
   * @param curCalcRect 根据拖动后计算得到的rect 属性
   */
  const handleLines = useCallback(
    (curCalcRect: CalcRectType) => {
      allBoxRectCollector.current.forEach((elementRect) => {
        const { top, left, width, height, bottom, right } = elementRect;
        const halfX = top + height / 2;
        const halfY = left + width / 2;
        const conditions = {
          top: [
            {
              isNearly: isNearly(top, curCalcRect.top),
              lineNode: line_n.current,
              showLine: () => showLine(line_n),
              lineStyle: {
                width:
                  curCalcRect.left > left
                    ? curCalcRect.left + curCalcRect.width - left
                    : right - curCalcRect.left,
                left: curCalcRect.left > left ? left : curCalcRect.left,
                top,
                height: 2,
              },
              adsorbNum: top,
            },
            {
              isNearly: isNearly(bottom, curCalcRect.top),
              lineNode: line_s.current,
              showLine: () => showLine(line_s),
              lineStyle: {
                width:
                  curCalcRect.left > left
                    ? curCalcRect.left + curCalcRect.width - left
                    : right - curCalcRect.left,
                left: curCalcRect.left > left ? left : curCalcRect.left,
                top: bottom,
                height: 2,
              },
              adsorbNum: bottom,
            },
            {
              isNearly: isNearly(bottom, curCalcRect.top + curCalcRect.height),
              lineNode: line_s.current,
              showLine: () => showLine(line_s),
              lineStyle: {
                width:
                  curCalcRect.left > left
                    ? curCalcRect.left + curCalcRect.width - left
                    : right - curCalcRect.left,
                left: curCalcRect.left > left ? left : curCalcRect.left,
                top: bottom,
                height: 2,
              },
              adsorbNum: bottom - curCalcRect.height,
            },
            {
              isNearly: isNearly(top, curCalcRect.top + curCalcRect.height),
              lineNode: line_s.current,
              showLine: () => showLine(line_s),
              lineStyle: {
                width:
                  curCalcRect.left > left
                    ? curCalcRect.left + curCalcRect.width - left
                    : right - curCalcRect.left,
                left: curCalcRect.left > left ? left : curCalcRect.left,
                top: top,
                height: 2,
              },
              adsorbNum: top - curCalcRect.height,
            },
            //我的中间跟别人的中间：x轴
            {
              isNearly: isNearly(
                halfX,
                curCalcRect.top + curCalcRect.height / 2,
              ),
              lineNode: line_mdx.current,
              showLine: () => showLine(line_mdx),
              lineStyle: {
                width:
                  curCalcRect.left > left
                    ? curCalcRect.left + curCalcRect.width - left
                    : right - curCalcRect.left,
                left: curCalcRect.left > left ? left : curCalcRect.left,
                top: halfX,
                height: 2,
              },
              adsorbNum: halfX - curCalcRect.height / 2,
            },
          ],
          left: [
            //我的左边跟别人的左边
            {
              isNearly: isNearly(left, curCalcRect.left),
              lineNode: line_w.current,
              showLine: () => showLine(line_w),
              lineStyle: {
                width: 2,
                left: left,
                top: curCalcRect.top > top ? top : curCalcRect.top,
                height:
                  curCalcRect.top > top
                    ? Math.abs(curCalcRect.top - top + collector.current.height)
                    : Math.abs(bottom - curCalcRect.top),
              },
              adsorbNum: left,
            },
            {
              isNearly: isNearly(left, curCalcRect.left + curCalcRect.width),
              lineNode: line_w.current,
              showLine: () => showLine(line_w),
              lineStyle: {
                width: 2,
                left: left,
                top: curCalcRect.top > top ? top : curCalcRect.top,
                height:
                  curCalcRect.top > top
                    ? Math.abs(curCalcRect.top - top + collector.current.height)
                    : Math.abs(bottom - curCalcRect.top),
              },
              adsorbNum: left - curCalcRect.width,
            },
            //我的右边跟别人的右边
            {
              isNearly: isNearly(right, curCalcRect.left + curCalcRect.width),
              lineNode: line_w.current,
              showLine: () => showLine(line_w),
              lineStyle: {
                width: 2,
                left: right,
                top: curCalcRect.top > top ? top : curCalcRect.top,
                height:
                  curCalcRect.top > top
                    ? Math.abs(curCalcRect.top - top + collector.current.height)
                    : Math.abs(bottom - curCalcRect.top),
              },
              adsorbNum: right - curCalcRect.width,
            },
            //我的左边跟别人的右边
            {
              isNearly: isNearly(right, curCalcRect.left),
              lineNode: line_w.current,
              showLine: () => showLine(line_w),
              lineStyle: {
                width: 2,
                left: right,
                top: curCalcRect.top > top ? top : curCalcRect.top,
                height:
                  curCalcRect.top > top
                    ? Math.abs(curCalcRect.top - top + collector.current.height)
                    : Math.abs(bottom - curCalcRect.top),
              },
              adsorbNum: right,
            },
            //我的 中间跟别人的中间：y 轴
            {
              isNearly: isNearly(
                halfY,
                curCalcRect.left + curCalcRect.width / 2,
              ),
              lineNode: line_mdy.current,
              showLine: () => showLine(line_mdy),
              lineStyle: {
                width: 2,
                left: halfY,
                top: curCalcRect.top > top ? top : curCalcRect.top,
                height:
                  curCalcRect.top > top
                    ? Math.abs(curCalcRect.top - top + collector.current.height)
                    : Math.abs(bottom - curCalcRect.top),
              },
              adsorbNum: halfY - curCalcRect.width / 2,
            },
          ],
        };

        (Object.keys(conditions) as Array<keyof typeof conditions>).forEach(
          (key) => {
            conditions[key].forEach(
              ({ isNearly, lineStyle, lineNode, adsorbNum, showLine }) => {
                if (isNearly) {
                  showLine();
                  (
                    Object.keys(lineStyle) as Array<keyof typeof lineStyle>
                  ).forEach(
                    (key) => {
                      return (lineNode!.style[key] = lineStyle[key] + 'px')
                    },
                  );
                  // 允许磁吸效果
                  if (adsorb) {
                    curCalcRect[key] = adsorbNum;
                  }
                  // lineNode!.title = `${lineStyle.width === 2 ? lineStyle.height :  lineStyle.width}`
                }
              },
            );
          },
        );
      });
    },
    [adsorb],
  );
  /**
   * 收集所有相同移动盒子的 rect 属性
   */
  const collectAllBoxRect = useCallback(() => {
    allBoxRectCollector.current = [];
    //其他所有相同的移动盒子
    let allBoxes = Array.from(
      (relative ? box.current?.parentElement! : document).querySelectorAll(
        '.resizable_box',
      ),
    ) as HTMLElement[];
    for (let boxItem of allBoxes) {
      if (boxItem === box.current) {
        continue;
      }
      let { width, height } = boxItem.getBoundingClientRect();
      let position: PositionType = {} as PositionType;
      if (relative) {
        Object.assign(position, {
          left: boxItem.offsetLeft,
          top: boxItem.offsetTop,
          bottom: boxItem.offsetTop + height,
          right: boxItem.offsetLeft + width,
        });
      } else {
        position = getCoords(boxItem);
      }

      allBoxRectCollector.current.push({
        width,
        height,
        ...position,
      });
    }
  }, [relative]);

  const onMove= useCallback((e:MouseEvent) => onMouseMove(e, 'moving'),[])
  const onSilence= useCallback((e:MouseEvent) => onMouseMove(e, 'silence'),[])
  const onTransfrom = useCallback((e:MouseEvent) => onMouseMove(e, 'trans'),[])

  const onLayerMouseUp = useCallback((e: MouseEvent, status?: string) => {
    hiddenLine();
    debugger
    let { left, top, width, height, pointX, pointY, shiftX, shiftY } =
        collector.current;
      let offsetX = pointX - getRate(e.pageX, rate);
      let offsetY = pointY - getRate(e.pageY, rate);
      // shiftX = getRate(shiftX, rate)
      // shiftY = getRate(shiftY, rate)

      let curCalcRect = handleCalcRect(
        { left, top, width, height },
        { offsetX, offsetY, shiftX, shiftY },
        e,
      );

    // console.log(`UP: e.pageX: ${e.pageX}| e.pageY: ${e.pageY} | offsetX: ${offsetX} | offsetY: ${offsetY} | curCalcRect.top: 
    // ${curCalcRect.top} | curCalcRect.left: ${curCalcRect.left}`)
      
    if (limit) {
      curCalcRect = handleLimit(curCalcRect, limit);
      onChange
      ? onChange({
          ...curCalcRect,
          width: Math.max(minWidth, curCalcRect.width),
          height: Math.max(minHeight, curCalcRect.height),
        })
      : setRectAttr({
        ...curCalcRect,
        width: Math.max(minWidth, curCalcRect.width),
        height: Math.max(minHeight, curCalcRect.height),
      });
    }

    if (active) {
      // 触发变形
      onTransEnd && onTransEnd({left,top,width,height})
        // 触发拖拽
      onDragEnd && onDragEnd({left,top,width,height})
    }
    // 失去激活
    setActive(false)
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mousemove', onTransfrom);
  }, [currentType, active]);

  const onMouseUp = useCallback((e: MouseEvent) => {
    setCurrentType('silence')
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mousemove', onTransfrom);
  }, []);


  const onMouseMove = useCallback(
    (e: MouseEvent, status?: string) => {
      console.log(`move:${status}`)
      let { left, top, width, height, pointX, pointY, shiftX, shiftY } =
        collector.current;
      let offsetX = pointX - getRate(e.pageX, rate)
      let offsetY = pointY - getRate(e.pageY, rate)

      let curCalcRect = handleCalcRect(
        { left, top, width, height },
        { offsetX, offsetY, shiftX, shiftY },
        e,
      );

      // console.log(`MOVE: e.pageX: ${e.pageX}| e.pageY: ${e.pageY} | offsetX: ${offsetX} | offsetY: ${offsetY} | curCalcRect.top: ${curCalcRect.top} | curCalcRect.left: ${curCalcRect.left}`)


      // 移动时处理辅助线
      if (direction.current === 'content' && guides) {
        hiddenLine();
        handleLines(curCalcRect);
      }

      if (status === 'moving') { // 移动状态 没有自动返回 有limit限制
        if (limit && !limitUpBack) {
          // curCalcRect = limitUpBack ? curCalcRect : handleLimit(curCalcRect, limit);
          curCalcRect = handleLimit(curCalcRect, limit); 
        }
        //取消选中区
        Selection ? window?.getSelection()?.collapseToStart() : null;
      } else if (status === 'trans') {
        if (limit){
          curCalcRect = handleLimit(curCalcRect, limit); 
        }
        //取消选中区
        Selection ? window?.getSelection()?.collapseToStart() : null;
      }
      

      onChange
        ? onChange({
            ...curCalcRect,
            width: Math.max(minWidth, curCalcRect.width),
            height: Math.max(minHeight, curCalcRect.height),
          })
        : setRectAttr({
            ...curCalcRect,
            width: Math.max(minWidth, curCalcRect.width),
            height: Math.max(minHeight, curCalcRect.height),
          });

        

          if (status === 'moving') { // 拖动移动
            onDrag && onDrag({left,top,width,height})
          } else if (status === 'trans') {// 触发拖拽
            onTrans && onTrans({left,top,width,height})
          }
    },
    [guides, currentType],
  );
  

  const onMouseDown = useCallback((
      e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
      currentDirection: Direction,
      status?: string
    ) => {
      // e.stopPropagation();
      //收集所有相同移动盒子的 rect 属性
      collectAllBoxRect();
      //只有左键才有效
      if (e.button !== 0) return;
      // 获取元素在文档中的rect属性
      let left, top, right, bottom;
      if (relative) {
        left = box.current?.offsetLeft!;
        top = box.current?.offsetTop!;
      } else {
        left = getCoords(box.current!).left;
        top = getCoords(box.current!).top;
      }
      right = left + box.current?.offsetWidth!;
      bottom = top + box.current?.offsetHeight!;

      // 获取元素矩阵大小
      let { width, height } = box.current?.getBoundingClientRect()!;
      // 存下鼠标点击后的鼠标坐标
      let pointX = getRate(e.pageX, rate),
        pointY = getRate(e.pageY, rate);
        // shiftX = getRate(shiftX, rate)
      // shiftY = getRate(shiftY, rate)
      // 鼠标在容器内点击的位置减去容器距离2边的距离
      let shiftX = pointX - left,
        shiftY = pointY - top;

      // 将所有属性都记录下来
      Object.assign(collector.current, {
        left,
        top,
        width,
        height,
        pointX,
        pointY,
        shiftX,
        shiftY,
        right,
        bottom,
      });

    //   console.log(`DOWN: e.pageX: ${e.pageX}| e.pageY: ${e.pageY} | shiftX: ${shiftX} | shiftY: ${shiftY} | collector.current.top: 
    // ${collector.current.top} | collector.current.left: ${collector.current.left}`)
      direction.current = currentDirection;
      if (status === 'trans') {
        // 触发变形
        onTransStart && onTransStart({left,top,width,height})
        document.addEventListener('mousemove', onTransfrom);
      } else {
        // 触发拖拽
        onDragStart && onDragStart({left,top,width,height})
        document.addEventListener('mousemove', onMove);
      }
      
      onChecked()
      setActive(true)
    },
    [currentType],
  );
  
  // document.addEventListener('mousemove', (e)=>{
  //   console.log(`pageX:${e.pageX} pageY: ${e.pageY}`)
  // });

  const onChecked = useCallback(() => setAllowResize(true), []);

  const onActived = useCallback((event: any) => {
    onChecked()
    setActive(true)
  }, []);
  const onUnActived = useCallback((event: any) => {
    setActive(false)
  }, [])

  const onCancelChecked = useCallback((e: MouseEvent) => {
    const isChild = box.current!.contains(e.target as Node);
    if (!isChild) {
      setAllowResize(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('click', onCancelChecked);
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('click', onCancelChecked);
    };
  }, []);

  const classes = useMemo(() => {
    return classNames('resizable_box', className, {
      checked: allowResize,
    });
  }, [allowResize]);

  return (
    <>
      <Wrap
        className={classes}
        ref={box}
        style={{ ...style, ...rect, ...rectAttr }}
        {...restProps}
      >
        {[
          'left_top',
          'left_bottom',
          'right_top',
          'right_bottom',
          'top',
          'bottom',
          'left',
          'right',
        ].map((item) => (
          <span
            key={item}
            className={allowResize ? `rect rect_${item} ${rectClassName}` : ''}
            onMouseDown={(e) => {
              setCurrentType('trans')
              onMouseDown(e, item as Direction, 'trans')
            }}
            onMouseUp={
              (e) => {
                setCurrentType('silence')
              }
            }
          ></span>
        ))}

        <div className="content" 
          onMouseDown={(e) => {
            setCurrentType('moving')
            onMouseDown(e, 'content', 'moving')
          }}
          onMouseUp = {(e:any) => {
            setCurrentType('silence')
            onLayerMouseUp(e, 'silence')
          }}
        >
          {props.children}
        </div>
      </Wrap>
      {[
        { className: 'n', ref: line_n },
        { className: 'e', ref: line_e },
        { className: 's', ref: line_s },
        { className: 'w', ref: line_w },
        { className: 'mdx', ref: line_mdx },
        { className: 'mdy', ref: line_mdy },
      ].map(({ className, ref }) => (
        <div
          key={className}
          style={{ backgroundColor: guidesColor }}
          className={`line line_${className}`}
          ref={ref}
        ></div>
      ))}
    </>
  );
});

export default DragResizableBox;

