import { useEffect } from "react";

export function useBackgroundCleanup() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const rootParent = root?.parentElement;

    const targets = [html, body, root, rootParent].filter(Boolean);

    const prev = targets.map((el) => ({
      el,
      background: el.style.background,
      backgroundImage: el.style.backgroundImage,
      backgroundColor: el.style.backgroundColor,
    }));

    targets.forEach((el) => {
      el.style.background = "none";
      el.style.backgroundImage = "none";
      el.style.backgroundColor = "transparent";
    });

    return () => {
      prev.forEach((p) => {
        p.el.style.background = p.background;
        p.el.style.backgroundImage = p.backgroundImage;
        p.el.style.backgroundColor = p.backgroundColor;
      });
    };
  }, []);
}
