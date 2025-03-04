/**
 * enumerates all weights of all fonts used on a page
 */
const usedFonts = (() => {
  const ret = {};
  document.querySelectorAll('*').forEach((element) => {
    const style = window.getComputedStyle(element);
    // const fontFamily = style.getPropertyValue("font-family");
    const fontFamily = style.getPropertyValue('font-family').split(',')[0].toLowerCase().replace(' ', '-').replace('"', '').replace('"', '');
    const fontWeight = style.getPropertyValue('font-weight');
    const fontStyle = style.getPropertyValue('font-style');
    const str = fontStyle !== 'normal' ? `${fontFamily}/${fontWeight}-${fontStyle}` : `${fontFamily}/${fontWeight}`;
    ret[str] = (ret[str] || 0) + 1;
  });
  console.info(ret);
})();

window.addEventListener('load', usedFonts);
