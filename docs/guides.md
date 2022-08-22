---
nav:
order: 6
---

# guides 辅助线

```tsx
import React from 'react';
import { DragResizableBox } from 'react-drag-resizable';

export default () => {
  return (
    <div style={{ height: '1000px', maxWidth: '1000px', position: 'relative', zoom:.5, backgroundColor:'#ff0000' }}>
      <div style={{ height: 50 }}></div>
      <DragResizableBox
        adsorb={false}
        limit={{left:0,top:0,right:300,bottom:300}}
        rect={{ width: 100, height: 50, top: 0, left: 0 }}
        style={{ backgroundColor: 'rgb(243,235,235)' }}
        relative
        rate={.5}
        diff={2}
      >
        <div>top</div>
      </DragResizableBox>
      
      <DragResizableBox
        relative
        rate={.5}
        adsorb={false}
        rect={{ left:0,top:0,width: 150, height: 150 }}
        style={{ backgroundColor: 'rgb(243,235,235)' }}
      >
        <div>move me!</div>
      </DragResizableBox>

      <DragResizableBox
        relative
        rate={.5}
        adsorb={false}
        rect={{ left:200,top:0,width: 150, height: 150 }}
        style={{ backgroundColor: 'rgb(243,235,235)' }}
      >
        <div>bottom</div>
      </DragResizableBox>


      <DragResizableBox
        relative
        rate={.5}
        adsorb={false}
        limit={{ left: 0, top: 0, right: 500, bottom: 500 }}
        rect={{ width: 100, height: 100, left: 0, top: 0 }}
        style={{ backgroundColor: '#898989' }}
      >
        <div
          style={{
            padding: '10px',
            width: '100%',
          }}
        >
          12313123
        </div>
      </DragResizableBox>
    </div>
  );
};
```

默认具有辅助线，如果你不需要辅助线，则可以将 guides 设置为 false

Guides are available by default，If you do not need guides, set the guides to false

通过 diff 属性可以控制多少距离时出现辅助线

The diff attribute allows you to control how far the auxiliary line appears
