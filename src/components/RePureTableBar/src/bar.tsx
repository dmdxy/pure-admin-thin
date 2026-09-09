import Sortable from "sortablejs";
import { transformI18n } from "@/plugins/i18n";
import { useEpThemeStoreHook } from "@/store/modules/epTheme";
import {
  type PropType,
  ref,
  unref,
  computed,
  nextTick,
  defineComponent,
  getCurrentInstance
} from "vue";
import {
  delay,
  cloneDeep,
  isBoolean,
  isFunction,
  getKeyList
} from "@pureadmin/utils";

import Fullscreen from "~icons/ri/fullscreen-fill";
import ExitFullscreen from "~icons/ri/fullscreen-exit-fill";
import DragIcon from "@/assets/table-bar/drag.svg?component";
import ExpandIcon from "@/assets/table-bar/expand.svg?component";
import RefreshIcon from "@/assets/table-bar/refresh.svg?component";
import SettingIcon from "@/assets/table-bar/settings.svg?component";
import CollapseIcon from "@/assets/table-bar/collapse.svg?component";

const props = {
  /** 头部最左边的标题，不传则不显示 */
  title: {
    type: String,
    default: ""
  },
  /** 对于树形表格，如果想启用展开和折叠功能，传入当前表格的ref即可 */
  tableRef: {
    type: Object as PropType<any>
  },
  /** 需要展示的列 */
  columns: {
    type: Array as PropType<TableColumnList>,
    default: () => []
  },
  isExpandAll: {
    type: Boolean,
    default: true
  },
  tableKey: {
    type: [String, Number] as PropType<string | number>,
    default: "0"
  }
};

export default defineComponent({
  name: "PureTableBar",
  props,
  emits: ["refresh", "fullscreen"],
  setup(props, { emit, slots, attrs }) {
    const size = ref("default");
    const loading = ref(false);
    const checkAll = ref(true);
    const isFullscreen = ref(false);
    const isIndeterminate = ref(false);
    const instance = getCurrentInstance()!;
    const isExpandAll = ref(props.isExpandAll);
    const filterColumns = cloneDeep(props?.columns).filter(column =>
      isBoolean(column?.hide)
        ? !column.hide
        : !(isFunction(column?.hide) && column?.hide())
    );
    let checkColumnList = getKeyList(cloneDeep(props?.columns), "label");
    const checkedColumns = ref(getKeyList(cloneDeep(filterColumns), "label"));
    const dynamicColumns = ref(cloneDeep(props?.columns));

    const getDropdownItemStyle = computed(() => {
      return s => {
        return {
          background:
            s === size.value ? useEpThemeStoreHook().epThemeColor : "",
          color: s === size.value ? "#fff" : "var(--el-text-color-primary)"
        };
      };
    });

    const toolBtnClass = "pure-table-tool-btn outline-hidden cursor-pointer";

    const toolIconClass = computed(() => {
      return ["w-4", "h-4"];
    });

    const topClass = computed(() => {
      return [
        "flex",
        "justify-between",
        "pt-2.5",
        "px-3",
        "border-b-[1px]",
        "border-solid",
        "border-[#dcdfe6]",
        "dark:border-[#303030]"
      ];
    });

    function onReFresh() {
      loading.value = true;
      emit("refresh");
      delay(500).then(() => (loading.value = false));
    }

    function onExpand() {
      isExpandAll.value = !isExpandAll.value;
      toggleRowExpansionAll(props.tableRef.data, isExpandAll.value);
    }

    function onFullscreen() {
      isFullscreen.value = !isFullscreen.value;
      emit("fullscreen", isFullscreen.value);
    }

    function toggleRowExpansionAll(data, isExpansion) {
      data.forEach(item => {
        props.tableRef.toggleRowExpansion(item, isExpansion);
        if (item.children !== undefined && item.children !== null) {
          toggleRowExpansionAll(item.children, isExpansion);
        }
      });
    }

    function handleCheckAllChange(val: boolean) {
      checkedColumns.value = val ? checkColumnList : [];
      isIndeterminate.value = false;
      dynamicColumns.value.map(column =>
        val ? (column.hide = false) : (column.hide = true)
      );
    }

    function handleCheckedColumnsChange(value: string[]) {
      checkedColumns.value = value;
      const checkedCount = value.length;
      checkAll.value = checkedCount === checkColumnList.length;
      isIndeterminate.value =
        checkedCount > 0 && checkedCount < checkColumnList.length;
    }

    function handleCheckColumnListChange(val: boolean, label: string) {
      dynamicColumns.value.filter(
        item => transformI18n(item.label) === transformI18n(label)
      )[0].hide = !val;
    }

    async function onReset() {
      checkAll.value = true;
      isIndeterminate.value = false;
      dynamicColumns.value = cloneDeep(props?.columns);
      checkColumnList = [];
      checkColumnList = await getKeyList(cloneDeep(props?.columns), "label");
      checkedColumns.value = getKeyList(cloneDeep(filterColumns), "label");
    }

    const dropdown = {
      dropdown: () => (
        <el-dropdown-menu class="translation">
          <el-dropdown-item
            style={getDropdownItemStyle.value("large")}
            onClick={() => (size.value = "large")}
          >
            宽松
          </el-dropdown-item>
          <el-dropdown-item
            style={getDropdownItemStyle.value("default")}
            onClick={() => (size.value = "default")}
          >
            默认
          </el-dropdown-item>
          <el-dropdown-item
            style={getDropdownItemStyle.value("small")}
            onClick={() => (size.value = "small")}
          >
            紧凑
          </el-dropdown-item>
        </el-dropdown-menu>
      )
    };

    /** 列展示拖拽排序 */
    const rowDrop = (event: { preventDefault: () => void }) => {
      event.preventDefault();
      nextTick(() => {
        const wrapper: HTMLElement = (
          instance?.proxy?.$refs[`GroupRef${unref(props.tableKey)}`] as any
        ).$el.firstElementChild;
        Sortable.create(wrapper, {
          animation: 300,
          handle: ".drag-btn",
          onEnd: ({ newIndex, oldIndex, item }) => {
            const targetThElem = item;
            const wrapperElem = targetThElem.parentNode as HTMLElement;
            const oldColumn = dynamicColumns.value[oldIndex];
            const newColumn = dynamicColumns.value[newIndex];
            if (oldColumn?.fixed || newColumn?.fixed) {
              // 当前列存在fixed属性 则不可拖拽
              const oldThElem = wrapperElem.children[oldIndex] as HTMLElement;
              if (newIndex > oldIndex) {
                wrapperElem.insertBefore(targetThElem, oldThElem);
              } else {
                wrapperElem.insertBefore(
                  targetThElem,
                  oldThElem ? oldThElem.nextElementSibling : oldThElem
                );
              }
              return;
            }
            const currentRow = dynamicColumns.value.splice(oldIndex, 1)[0];
            dynamicColumns.value.splice(newIndex, 0, currentRow);
          }
        });
      });
    };

    const isFixedColumn = (label: string) => {
      return dynamicColumns.value.filter(
        item => transformI18n(item.label) === transformI18n(label)
      )[0].fixed
        ? true
        : false;
    };

    const rendTippyProps = (content: string) => {
      // https://vue-tippy.netlify.app/props
      return {
        content,
        offset: [0, 18],
        duration: [300, 0],
        followCursor: true,
        hideOnClick: "toggle"
      };
    };

    const reference = {
      reference: () => (
        <span class={toolBtnClass} v-tippy={rendTippyProps("列设置")}>
          <SettingIcon class={toolIconClass.value} />
        </span>
      )
    };

    return () => (
      <div
        {...attrs}
        class={[
          "pure-table-bar",
          "w-full",
          "bg-bg_color",
          "flex",
          "flex-col",
          "min-h-0",
          "overflow-hidden",
          isFullscreen.value
            ? ["h-full!", "z-2002", "fixed", "inset-0"]
            : ["flex-1"]
        ]}
        style={{
          padding: "var(--pure-block-pad)",
          borderRadius: isFullscreen.value ? 0 : "var(--pure-block-radius)"
        }}
      >
        <div
          class="pure-table-bar__header flex items-center justify-between w-full shrink-0"
          style={{
            paddingBottom: "var(--pure-block-gap)"
          }}
        >
          <div class="flex items-center min-w-0">
            {slots?.buttons ? (
              <div class="flex items-center">{slots.buttons()}</div>
            ) : null}
            {slots?.title ? (
              slots.title()
            ) : props.title ? (
              <p class="font-bold truncate">{props.title}</p>
            ) : null}
          </div>
          <div class="flex items-center shrink-0 gap-0.5">
            {props.tableRef?.size ? (
              <span
                class={toolBtnClass}
                v-tippy={rendTippyProps(isExpandAll.value ? "折叠" : "展开")}
                onClick={() => onExpand()}
              >
                <ExpandIcon
                  class={toolIconClass.value}
                  style={{
                    transform: isExpandAll.value ? "none" : "rotate(-90deg)"
                  }}
                />
              </span>
            ) : null}
            <span
              class={toolBtnClass}
              v-tippy={rendTippyProps("刷新")}
              onClick={() => onReFresh()}
            >
              <RefreshIcon
                class={[
                  toolIconClass.value,
                  loading.value ? "animate-spin" : ""
                ]}
              />
            </span>
            <el-dropdown
              v-slots={dropdown}
              trigger="click"
              v-tippy={rendTippyProps("行距")}
            >
              <span class={toolBtnClass}>
                <CollapseIcon class={toolIconClass.value} />
              </span>
            </el-dropdown>

            <el-popover
              v-slots={reference}
              placement="bottom-start"
              popper-style={{ padding: 0 }}
              width="200"
              trigger="click"
            >
              <div class={[topClass.value]}>
                <el-checkbox
                  class="-mr-1!"
                  label="列展示"
                  v-model={checkAll.value}
                  indeterminate={isIndeterminate.value}
                  onChange={value => handleCheckAllChange(value)}
                />
                <el-button type="primary" link onClick={() => onReset()}>
                  重置
                </el-button>
              </div>

              <div class="pt-[6px] pl-[11px]">
                <el-scrollbar max-height="36vh">
                  <el-checkbox-group
                    ref={`GroupRef${unref(props.tableKey)}`}
                    modelValue={checkedColumns.value}
                    onChange={value => handleCheckedColumnsChange(value)}
                  >
                    <el-space
                      direction="vertical"
                      alignment="flex-start"
                      size={0}
                    >
                      {checkColumnList.map((item, index) => {
                        return (
                          <div class="flex items-center">
                            <DragIcon
                              class={[
                                "drag-btn w-[16px] mr-2",
                                isFixedColumn(item)
                                  ? "cursor-no-drop!"
                                  : "cursor-grab!"
                              ]}
                              onMouseenter={(event: {
                                preventDefault: () => void;
                              }) => rowDrop(event)}
                            />
                            <el-checkbox
                              key={index}
                              label={item}
                              value={item}
                              onChange={value =>
                                handleCheckColumnListChange(value, item)
                              }
                            >
                              <span
                                title={transformI18n(item)}
                                class="inline-block w-[120px] truncate hover:text-text_color_primary"
                              >
                                {transformI18n(item)}
                              </span>
                            </el-checkbox>
                          </div>
                        );
                      })}
                    </el-space>
                  </el-checkbox-group>
                </el-scrollbar>
              </div>
            </el-popover>
            <span
              class={toolBtnClass}
              v-tippy={isFullscreen.value ? "退出全屏" : "全屏"}
              onClick={() => onFullscreen()}
            >
              <iconifyIconOffline
                class={toolIconClass.value}
                icon={isFullscreen.value ? ExitFullscreen : Fullscreen}
              />
            </span>
          </div>
        </div>
        <div class="pure-table-bar__body flex-1 min-h-0 overflow-hidden">
          {slots.default({
            size: size.value,
            dynamicColumns: dynamicColumns.value,
            height: "100%"
          })}
        </div>
      </div>
    );
  }
});
