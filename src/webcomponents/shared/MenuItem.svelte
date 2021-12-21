<svelte:options tag="menu-item" />

<script>
  import { afterUpdate } from "svelte";
  import { get_current_component } from "svelte/internal";

  export let item = {};
  export let active = null;
  export let expanded = false;
  export let isParent = false;
  export let menulevel = 0;
  export let menu = [];
  export let select;
  export let scrolling = false;

  $: selected = item.id === active;
  $: child = !item.icon && !item.children;
  $: rotated = expanded;
  $: isParent = !!item.children;
  $: expanded = item.expanded;
  $: children = menu.filter((i) => i.parent === item.id);
  $: hasactive =
    children.find((child) => child.id === active) ||
    children.find((child) => child.hasActive);

  let childContainer;

  // add HTML title prop to overflow title & subtitle <p> elements
  // check if text-overflow ellipsis is present on title & subtitle in DOM after render
  // use isTitleWrapped & isSubtitleWrapped booleans in template to decide if title is needed
  let elTitle, elSubtitle;
  let isTitleWrapped, isSubtitleWrapped;
  afterUpdate(() => {
    elTitle && (isTitleWrapped = elTitle.offsetHeight < elTitle.scrollHeight);
    elSubtitle &&
      (isSubtitleWrapped = elSubtitle.offsetHeight < elSubtitle.scrollHeight);
  });

  const menuLevelColors = {
    0: "var(--ripe-app-primary-900, #080037)",
    1: "var(--ripe-app-primary-800, #0F154C)",
    2: "var(--ripe-app-primary-700, #171D58)",
  };

  $: bgStyle = expanded
    ? `background: ${menuLevelColors[Math.min(menulevel + 1, 2)]};`
    : `background: ${menuLevelColors[menulevel]};`;

  const component = get_current_component();

  const toggle = (e) => {
    e.preventDefault();
    animateChildContainer(!expanded);
    expanded = !expanded;
    dispatchExpandEvent();
  };

  /*
  if menuitem has children, toggle expand state on click
  and sets clicked menuitem as active
  */
  const setActiveAndToggleExpand = (e) => {
    if (scrolling) return;
    e.preventDefault();
    if (children.length > 0 && !expanded) {
      animateChildContainer(true);
      expanded = true;
      dispatchExpandEvent();
    } else if (children.length > 0 && expanded) {
      animateChildContainer(false);
      expanded = false;
      dispatchExpandEvent();
    }
    select(item);
  };

  const dispatchExpandEvent = () => {
    const event = new CustomEvent("expand", {
      detail: {
        id: item.id,
        expanded: expanded,
      },
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    component.dispatchEvent(event);
  };

  const isMobile = /Mobi|Android/.test(navigator.userAgent);
  const isPwa =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone;
  const hoverenabled = !isMobile && !isPwa;

  const animateChildContainer = (isExpanding) => {
    // return early if web animations API not available in browser
    // looking at you, safari
    if (typeof childContainer.animate !== "function") return;

    const currentHeight = childContainer.getBoundingClientRect().height;
    const numOfChildren = children && children.length;
    childContainer.animate(
      [
        {
          height: isExpanding ? 0 : `${currentHeight}px`,
          opacity: isExpanding ? 0 : 1,
        },
        {
          height: isExpanding ? `${numOfChildren * 60}px` : 0,
          opacity: isExpanding ? 1 : 0,
        },
      ],
      {
        duration: 200,
        easing: "ease-in-out",
      }
    );
  };
</script>

<div
  class="item"
  class:selected
  class:expanded={!expanded}
  class:child
  class:hoverenabled
  style={bgStyle}
>
  <a
    class="item"
    class:selected
    href={item.url}
    on:click={(e) => e.preventDefault()}
  >
    <div class="indicator" />
    <div
      class="icon menuicon"
      on:click={setActiveAndToggleExpand}
      on:touchend={setActiveAndToggleExpand}
    >
      {#if item.icon}
        {@html item.icon}
      {/if}
    </div>
    <div
      class="text"
      on:click={setActiveAndToggleExpand}
      on:touchend={setActiveAndToggleExpand}
    >
      <div class="text-wrap wrapped-title">
        <p
          bind:this={elTitle}
          class="title"
          title={isTitleWrapped ? item.title : ""}
          id={`title-${item.id}`}
        >
          {item.title}
        </p>
      </div>
      {#if item.subtitle}
        <div class="text-wrap wrapped-subtitle">
          <p
            bind:this={elSubtitle}
            class="subtitle"
            title={isSubtitleWrapped ? item.subtitle : ""}
            id={`subtitle-${item.id}`}
          >
            {item.subtitle}
          </p>
        </div>
      {/if}
    </div>
  </a>

  {#if children.length > 0}
    <div
      class="icon chevron"
      class:rotated
      class:hasactive
      on:click|stopPropagation={toggle}
      on:touchend|stopPropagation={toggle}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 512"
        style="overflow: visible;"
        aria-label="expand menu item icon"
      >
        <path
          fill="transparent"
          stroke="currentColor"
          stroke-width="40"
          d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z"
        />
      </svg>
    </div>
  {/if}
</div>

<div bind:this={childContainer} style={bgStyle}>
  {#if children.length > 0 && expanded}
    {#each children as child}
      <menu-item
        {menu}
        item={child}
        {active}
        menulevel={menulevel + 1}
        {select}
        {scrolling}
      />
    {/each}
  {/if}
</div>

<style lang="scss">
  :host {
    display: block;
    transition: height 0.2s ease-in-out;
  }

  .item {
    display: flex;
    height: 60px;
    position: relative;
    cursor: pointer;
    user-select: none;
    width: 300px;
    transition: background 0.2s ease-in-out;
    color: #b8bbd0;
    text-decoration: none;

    .indicator {
      position: absolute;
      top: 0;
      left: 0;
      content: "";
      width: 0px;
      height: 100%;
      background: #f59331;

      &.hasactive-indicator {
        color: #b8bbd0;
        opacity: 0.5;
        width: 6px;
      }
    }

    &.selected,
    &.selected:hover {
      color: #ffffff;
      opacity: 1 !important;
      .indicator {
        width: 6px;
        opacity: 1;
      }
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      &.menuicon {
        width: 70px;
        * {
          height: 24px;
        }
      }
      &.chevron {
        color: #9d9aac;
        flex: 0.3;
        min-width: 60px;
        transition: transform 0.1s ease-in-out;
        * {
          width: 14px;
          height: 14px;
        }
        &.rotated {
          transform: rotate(90deg);
        }
        &.disabled {
          opacity: 0.5;
        }
        &.hasactive {
          color: gold;
        }
      }
    }

    .text {
      display: flex;
      justify-content: center;
      flex-direction: column;
      flex: 1;
      font-family: Helvetica, Arial, Sans-serif;
      font-size: 0.91rem;
      font-weight: 600;
      line-height: 1.3em;
      text-rendering: geometricPrecision;
      padding-right: 1rem;

      .text-wrap {
        display: -webkit-box;
        overflow: hidden;
        text-overflow: ellipsis;
        -webkit-box-orient: vertical;
        &.wrapped-title {
          -webkit-line-clamp: 1;
        }
        &.wrapped-subtitle {
          -webkit-line-clamp: 2;
        }
      }

      p {
        margin: 0;
      }
      .title {
        font-weight: 600;
      }
      .subtitle {
        font-size: 0.78rem;
        font-weight: 175;
        letter-spacing: 0.03333rem;
      }
    }
    &.child {
      height: 60px;
    }
  }
  .hoverenabled {
    &:hover {
      color: #b8bbd0;
      .indicator {
        opacity: 0.5;
        width: 6px;
      }
    }
  }
  .expanded {
    transition: none;
  }
  .boxed {
    box-shadow: inset 26px 0px 0px -20px #1b204c,
      inset -26px 0px 0px -20px #1b204c;
  }
</style>
