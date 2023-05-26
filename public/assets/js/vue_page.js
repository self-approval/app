/* Inspired from solution by Sttot (https://github.com/gk0wk), */

var footerHTML =
    '<footer>' +
    '   <hr>' +
    '   <div style="align-items: center; display: flex; justify-content: center; margin-bottom: 0.56em;">' +
    '   <img src="powered-by-vercel.svg" alt="Powered by Vercel" width="auto" height="28">' +
    '   </div>' +
    '   <a href="https://github.com/self-approval/app" title="GitHub"><i data-feather="github"></i></a> | ' +
    '   <a href="https://github.com/self-approval/app/blob/main/LICENSE">ISC License</a>' +
    '   &copy; 2022' +
    '   <a href="https://github.com/iXORTech">iXOR Technology</a>'+
    '   &' +
    '   <a href="https://github.com/Cubik65536">Cubik65536</a>' +
    '   <br/>' +
    '   HTML theme designed by <a href="https://github.com/athul/archie" rel="nofollow noopener noreferrer">Archie Theme</a>, modified by <a href="https://github.com/KevinZonda" rel="nofollow noopener noreferrer">@KevinZonda</a>.' +
    '</footer>';

// @ts-ignore
function buildOnce(genApp, hookDom) {
  // @ts-ignore
    var vueInstance = Vue.createApp(
    Object.assign(
      {
        mounted() {
          vueInstance.unmount();
        },
      },
      genApp()
    )
  );
  vueInstance.mount(hookDom);
}

buildOnce(function () {
  return {
    data() {
      return {
        footer: footerHTML,
      };
    },
  };
}, "#page-wrapper");
