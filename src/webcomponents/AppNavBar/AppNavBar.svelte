<svelte:options tag="app-nav-bar" />

<script>
  import { onMount } from "svelte";
  import { get_current_component } from "svelte/internal";

  export let menu = "{}";
  export let open;
  export let active;
  let sidemenu;
  let initialRender = true;

  const component = get_current_component();

  // html attributes will be passed as an empty string,
  // which evaluates to false in JS, so check for 'truthy' + ""
  $: open = !!(open || open === "");
  // initMenu is the initial state inserted by the consumer
  // of the component.
  // It is enriched with:
  // - if no 'id' field was passed in 'title' value is copied into the 'id' field
  // - if no 'parent' field was passed in its value is set to null
  $: initMenu = Object.entries(JSON.parse(menu)).reduce((acc, kv) => {
    const [k, v] = kv;
    acc[k] =
      (Array.isArray(v) &&
        v.map((i) => ({
          ...i,
          id: i.id || i.title,
          parent: i.parent || null,
        }))) ||
      v;
    return acc;
  }, {});
  // This assignment will only be done once when initMenu is ready,
  // so parsedMenu will be the most recent state (init + results of user interactions)
  $: parsedMenu = initMenu;
  $: expandedItems = [];
  $: topLevelItems = [];
  $: menuScrolling = false;
  // Theoretically there is a better way than this:
  // We should be able to merge the current `parsedMenu` tree
  // (holding all the state that's the result of the user's choices)
  // with the default tree that is JSON.parse(menu)
  // However I cannot find a way to refer to parsedMenu within
  // an $: reactive assignment ( `$: parsedMenu = yada yada`).
  // The moment you refer to parsedMenu in there you will see
  // weird behaviour (I suspect Svelte eats errors in closures that
  // refer to the var that's being assigned).
  // So instead of keeping everything in one tree-like structure,
  // we move in them in completely separate (reactive) srtructures:
  // `expandedItems` and those we can refer to.
  // This is why we're re-assembling the `expandedItems` into their
  // realted items only when we pass in the menu-item compnents
  // (see above)
  $: parsedMenu &&
    (() => {
      if (Object.keys(parsedMenu).length === 0) return;
      // expand parent(s) of active item only at initial render
      if (initialRender && active) {
        const nestedItems = parsedMenu.main.filter((i) => i.parent !== null);
        const nestedActive = nestedItems.find((i) => i.id === active);
        if (nestedActive) {
          const parent = parsedMenu.main.find(
            (i) => i.id === nestedActive.parent
          );
          parent.expanded = true;
          if (parent.parent !== null) {
            const grandPa = parsedMenu.main.find((i) => i.id === parent.parent);
            grandPa.expanded = true;
          }
        }
        initialRender = false;
      }
      expandedItems = Array.from(
        new Set(
          expandedItems.concat(
            parsedMenu.main.filter((i) => i.expanded).map((i) => i.id)
          )
        )
      );
      parsedMenu.main.forEach((i) => {
        if (!i.id) {
          i.id = i.title;
        }
        const ii = initMenu.main.find((ii) => ii.id === i.id);
        i.hasActive = i.id === active ? true : false || !!i.hasActive;
        i.expanded = expandedItems.some((ii) => ii === i.id) || !!i.expanded;
        i.title = ii.title;
        i.subtitle = ii.subtitle;
      });
      parsedMenu.footer.forEach((i) => {
        if (!i.id) {
          i.id = i.title;
        }
        const ii = initMenu.footer.find((ii) => ii.id === i.id);
        i.hasActive = i.id === active ? true : false || !!i.hasActive;
        i.expanded = expandedItems.some((ii) => ii === i.id) || !!i.expanded;
        i.title = ii.title;
        i.subtitle = ii.subtitle;
      });
      topLevelItems = parsedMenu.main.filter((item) => item.parent === null);
      updateMenuOnActiveChange(active);
    })();

  onMount(() => {
    /*
    Setting --vh CSS var on html
    webkit mobile browsers will set fixed vh which won't be updated
    when address bar moves out of view, causing sidemenu to be smaller
    than the desired 100vh
    --vh var set & updated on resize as 1% of window.innerHeight
    https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
    */
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
    window.addEventListener("resize", () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    });

    // Add event listener to #sidemenu div.
    // Click events will be disabled while scrolling to prevent
    // selecting items while swiping on mobile
    let isScrolling;
    sidemenu.addEventListener("touchmove", () => {
      menuScrolling = true;
    });
    sidemenu.addEventListener("touchend", () => {
      menuScrolling = false;
    });
    sidemenu.addEventListener("scroll", () => {
      menuScrolling = true;
      window.clearTimeout(isScrolling);
      isScrolling = setTimeout(function () {
        // Run the callback
        menuScrolling = false;
      }, 300);
    });
  });

  const expandHandler = (e) => {
    // This handler only does bookkeeping in
    // the parsedMenu.main structure and
    // `expandedItems` structure, so that expansion state
    // can be rebuilt accross reloads/first renders.
    const expItem = parsedMenu.main.find((i) => i.id === e.detail.id);
    if (expItem) {
      expItem.expanded = e.detail.expanded;

      // if item being collapsed has expanded children, collapse them too
      // this is to avoid choppy animation on expanding items with expanded children
      const expandedChildren = parsedMenu.main.filter(
        (i) => i.parent === e.detail.id && i.expanded
      );
      expandedChildren.forEach((c) => (c.expanded = false));

      // Alhhough the expandedItems state is also collected in the
      // automagic $ reactive assigment, that will only fire
      // if a select happened, so here we also store it in that structure
      expandedItems = parsedMenu.main
        .filter((i) => i.expanded)
        .map((i) => i.id);
    }
  };

  function setParentActive(child) {
    if (child.parent === null || child.parent === "invisible") return;
    const activeParent = parsedMenu.main.find(
      (item) => item.id === child.parent
    );
    activeParent.hasActive = true;
    setParentActive(activeParent);
  }

  const updateMenuOnActiveChange = (newActiveTitle) => {
    // if (typeof active === 'undefined') return
    // if (parsedMenu.main && parsedMenu.main.length === 0) return

    const mainItemActive = parsedMenu.main.find((item) => item.id === active);
    const activeItem =
      mainItemActive || parsedMenu.footer.find((item) => item.id === active);

    parsedMenu.main.forEach((item) => (item.hasActive = false));

    if (mainItemActive) {
      setParentActive(activeItem);
    }

    active = newActiveTitle;
  };

  const selectHandler = (selected) => {
    if (menuScrolling) return;
    updateMenuOnActiveChange(selected.id);
    const event = new CustomEvent("app-nav-bar-select", {
      detail: {
        selected,
      },
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    component.dispatchEvent(event);
  };
</script>

<div id="sidemenu" class:open bind:this={sidemenu}>
  <div id="menu">
    {#if parsedMenu.main}
      {#each topLevelItems as item}
        <!-- See story below why we're doing the iterating over expandedItems
             instead of passing in the item's field directly -->
        <menu-item
          menu={parsedMenu.main}
          item={{ ...item, expanded: expandedItems.some((i) => i === item.id) }}
          {active}
          on:expand={expandHandler}
          class="top-level"
          select={selectHandler}
          scrolling={menuScrolling}
        />
      {/each}
    {/if}
  </div>
  <div id="footer">
    {#if parsedMenu.footer}
      {#each parsedMenu.footer as item}
        <menu-item
          {item}
          {active}
          on:expand={expandHandler}
          class="top-level"
          select={selectHandler}
          scrolling={menuScrolling}
        />
      {/each}
    {/if}
  </div>
</div>

<style lang="scss">
  ::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }
  #sidemenu {
    @media only screen and (max-width: 700px) {
      position: fixed;
    }
  }

  #sidemenu {
    overflow-x: hidden;
    overflow-y: scroll;
    z-index: 1000;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }

    &.open {
      margin-left: 0;
    }
    background-color: #080037;
    position: sticky;
    top: 70px;
    margin-left: -300px;
    transition: margin-left 0.2s ease-in-out;
    height: 100vh;
    height: calc(var(--vh, 1vh) * 100 - 70px);
    width: 300px;
    box-shadow: 0 0 7px rgba(0, 0, 0, 0.3);
    user-select: none;
    display: flex;
    flex-direction: column;
    @media print {
      display: none;
    }

    #menu {
      margin-top: 1rem;
      justify-content: flex-start;
      flex: 1 0 auto;

      menu-item.top-level {
        margin-bottom: 4px;
      }
    }
    #footer {
      justify-content: flex-end;
      margin-top: 3rem;
      padding-bottom: 1rem;
      border-top: 1px solid #2f2c56;
    }
  }
</style>
