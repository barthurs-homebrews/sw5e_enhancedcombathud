Hooks.on("pickerDone", (element, color) => {
  // Handle Theme
  let $element = $(element);
  let $settings = $element.closest("#echThemeOptions");

  if ($settings.length > 0) {
    $settings.find('.window-content select[name="theme"]').val("custom");
  }
});

class echThemeOptions extends FormApplication {
  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      title: "Theme Options",
      id: "echThemeOptions",
      template: "modules/sw5eenhancedcombathud/templates/theme-options.hbs",
      resizable: true,
      width: 660,
      height: $(window).height(),
      createTheme: () => {
        new Dialog({
          title: "Export Argon - Combat HUD Theme",
          content: `<form id="echExportTheme">
            <div class="form-group">
              <label>${game.i18n.localize(
                "sw5eenhancedcombathud.themeOptions.exportThemeName"
              )}</label>
              <input type="text" name="echExportThemeName"/>
            </div>
          </form>`,
          buttons: {
            export: {
              label: "Save",
              callback: (event) => {
                console.log(event);
                console.log(echThemeOptions.defaultOptions.getThemeColors());
                const themeName = $(event)
                  .find('input[name="echExportThemeName"]')
                  .val();
                const theme = new File(
                  [
                    new Blob(
                      [
                        JSON.stringify(
                          echThemeOptions.defaultOptions.getThemeColors()
                        ),
                      ],
                      { type: "application/json" }
                    ),
                  ],
                  `${themeName}.json`
                );
                FilePicker.upload(
                  "data",
                  "./modules/sw5eenhancedcombathud/scripts/themes/",
                  theme
                ).then((response) => {
                  echThemeOptions.defaultOptions.buildDropdown(themeName);
                });
              },
            },
            cancel: {
              label: "Cancel",
              callback: (event) => {
                return true;
              },
            },
          },
          default: "export",
          render: (html) => {
            let $dialog = $(html);
            $dialog.find('button[data-button="export"]').prop("disabled", true);
            $dialog
              .find('input[name="echExportThemeName"]')
              .on("keyup", (event) => {
                let $input = $dialog.find('input[name="echExportThemeName"]');
                $input.val(
                  $input
                    .val()
                    .replace(/[^a-z0-9]/gi, "-")
                    .replace(/-{2,}/g, "-")
                    .toLowerCase()
                );
                $dialog
                  .find('button[data-button="export"]')
                  .prop("disabled", $input.val().length <= 1);
              });
            $dialog.find('input[name="echExportThemeName"]').focus();
          },
        }).render(true);
      },
      getThemeColors: () => {
        function setDeepObj(obj, path, val) {
          var props = path.split(".");
          for (var i = 0, n = props.length - 1; i < n; ++i) {
            obj = obj[props[i]] = obj[props[i]] || {};
          }
          obj[props[i]] = val;
          return obj;
        }

        let theme = {};

        $('#echThemeOptions .window-content button[name="colored"]').each(
          (index, button) => {
            let $button = $(button);
            setDeepObj(theme, $button.data("setting"), $button.attr("value"));
          }
        );

        // Export Theme
        return theme.colors;
      },
      buildDropdown: (selectedTheme) => {
        if (typeof selectedTheme == "undefined")
          game.settings.get("sw5eenhancedcombathud", "echThemeData").theme;

        $("#echThemeOptions").find('select[name="theme"] option').remove();

        FilePicker.browse(
          "user",
          `./modules/sw5eenhancedcombathud/scripts/themes`,
          { extensions: [".json"] }
        )
          .then((response) => {
            let files = response.files;
            if (files.length > 0) {
              return files;
            }
            throw TypeError(
              `No theme files found in sw5eenhancedcombathud/scripts/themes`
            );
          })
          .then((files) => {
            $("#echThemeOptions")
              .find('select[name="theme"]')
              .append(`<option value="custom">Custom</option>`);
            files.forEach((file) => {
              let filename = file
                .split("/")
                [file.split("/").length - 1].replace(/\.json/gi, "");
              $("#echThemeOptions")
                .find('select[name="theme"]')
                .append(
                  `<option value="${filename}">${
                    filename[0].toUpperCase() + filename.substring(1)
                  }</option>`
                );
            });
            $("#echThemeOptions")
              .find('select[name="theme"]')
              .val(selectedTheme);
          })
          .catch((error) => console.log(error));
      },
    };
  }
  getData() {
    return {
      themeOptions: game.settings.get("sw5eenhancedcombathud", "echThemeData"),
    };
  }
  activateListeners(html) {
    super.activateListeners(html);
    // Hex to rgba
    function _convertHexUnitTo256(hexStr) {
      return parseInt(hexStr.repeat(2 / hexStr.length), 16);
    }
    const getTextColor = (hexColor) => {
      const rgbaColor = (hex) => {
        const hexArr = hex.slice(1).match(new RegExp(".{2}", "g"));
        const [r, g, b, a] = hexArr.map(_convertHexUnitTo256);
        return [r, g, b, Math.round((a / 256 + Number.EPSILON) * 100) / 100];
      };

      const rgba = rgbaColor(hexColor);
      const brightness = Math.round(
        (rgba[0] * 299 + rgba[1] * 587 + rgba[2] * 114) / 1000
      );

      if (rgba[3] > 0.5) {
        return brightness > 125 ? "black" : "white";
      } else {
        return "black";
      }
    };

    echThemeOptions.defaultOptions.buildDropdown(
      game.settings.get("sw5eenhancedcombathud", "echThemeData").theme
    );

    /*FilePicker.browse('user', `./modules/sw5eenhancedcombathud/scripts/themes`, { extensions: ['.json'] }).then(response => {
      let files = response.files;
      if (files.length > 0) {
        return files;
      }
      throw TypeError(`No theme files found in sw5eenhancedcombathud/scripts/themes`);
    }).then(files => {
      files.forEach(file => {
        let filename = file.split('/')[file.split('/').length - 1].replace(/\.json/gi, '')
        $(html).find('select[name="theme"]').append(`<option value="${filename}">${filename[0].toUpperCase() + filename.substring(1)}</option>`);
      })
      $(html).find('select[name="theme"]').val(game.settings.get("sw5eenhancedcombathud", "echThemeData").theme);
    }).catch(error => console.log(error));*/

    // Handle Theme Selection
    $(html)
      .find('select[name="theme"]')
      .on("change", (event) => {
        let selectedTheme = $(event.currentTarget).val();
        const updateColors = (theme) => {
          $(html)
            .find('button[name="colored"]')
            .each((index, button) => {
              let $button = $(button);
              let setting = $button.data("setting").replace(/colors\./g, "");
              let value = setting
                .split(".")
                .reduce((p, c) => (p && p[c]) || null, theme);

              if (value != null) {
                $button.attr("value", value).css({
                  "background-color": value,
                  color: getTextColor(value),
                });
              }
            });
        };

        if (selectedTheme != "custom") {
          fetch(
            `./modules/sw5eenhancedcombathud/scripts/themes/${selectedTheme}.json`
          )
            .then((response) => response.json())
            .then((colors) => {
              updateColors(colors);
            });
        } else {
          updateColors(
            game.settings.get("sw5eenhancedcombathud", "echThemeData").colors
          );
        }
      });

    // Update Custom Themes
  }
  async _updateObject(event, formData) {
    function setDeepObj(obj, path, val) {
      var props = path.split(".");
      for (var i = 0, n = props.length - 1; i < n; ++i) {
        obj = obj[props[i]] = obj[props[i]] || {};
      }
      obj[props[i]] = val;
      return obj;
    }

    let themeOptions = game.settings.get("sw5eenhancedcombathud", "echThemeData");

    $(event.srcElement)
      .find('button[name="colored"]')
      .each((index, button) => {
        let $button = $(button);
        setDeepObj(formData, $button.data("setting"), $button.attr("value"));
      });

    await game.settings.set("sw5eenhancedcombathud", "echThemeData", formData);
    canvas.hud.sw5eenhancedcombathud?.setColorSettings();
  }
}

Hooks.once("init", function () {
  game.settings.register("sw5eenhancedcombathud", "echThemeData", {
    name: "Data used for Theming",
    type: Object,
    default: {
      theme: "custom",
      font: "Roboto",
      colors: {
        mainAction: {
          base: {
            background: "#414B55E6",
            color: "#B4D2DCFF",
            border: "#757f89FF",
          },
          hover: {
            background: "#747e88e6",
            color: "#B4D2DCFF",
            border: "#757f89FF",
          },
        },
        bonusAction: {
          base: {
            background: "#453B75E6",
            color: "#B4D2DCFF",
            border: "#757f89FF",
          },
          hover: {
            background: "#9288c2e6",
            color: "#B4D2DCFF",
            border: "#757f89FF",
          },
        },
        freeAction: {
          base: {
            background: "#3B5875E6",
            color: "#B4D2DCFF",
            border: "#757f89FF",
          },
          hover: {
            background: "#88a5c2e6",
            color: "#B4D2DCFF",
            border: "#757f89FF",
          },
        },
        reaction: {
          base: {
            background: "#753B3BE6",
            color: "#B4D2DCFF",
            border: "#757f89FF",
          },
          hover: {
            background: "#c28888e6",
            color: "#B4D2DCFF",
            border: "#757f89FF",
          },
        },
        endTurn: {
          base: {
            background: "#374B3CE6",
            color: "#B4D2DCFF",
            border: "#757f89FF",
          },
          hover: {
            background: "#849889e6",
            color: "#B4D2DCFF",
            border: "#757f89FF",
          },
        },
        tooltip: {
          header: {
            background: "#ffffffCC",
            color: "#414146",
            border: "#757f89FF",
          },
          subtitle: {
            background: "#32505a",
            color: "#ffffff",
            border: "#757f89FF",
          },
          body: {
            background: "#5a7896B3",
            color: "#ffffff",
            border: "#757f89FF",
          },
        },
        abilityMenu: {
          background: "#414B55E6",
          color: "#B4D2DCFF",
          border: "#757f89FF",
          base: { color: "#B4D2DCFF", boxShadow: "#757f89CC" },
          hover: { color: "#B4D2DCFF", boxShadow: "#757f89CC" },
        },
        buttons: {
          base: {
            background: "#5096c3",
            color: "#ffffff",
            border: "#5096c3",
          },
          hover: {
            background: "#55bef5",
            color: "#ffffffff",
            border: "#55bef5",
          },
        },
        movement: {
          used: { background: "#7d879180", boxShadow: "#00000000" },
          baseMovement: { background: "#5abef5FF", boxShadow: "#6ed2ffCC" },
          dashMovement: { background: "#c8c85aFF", boxShadow: "#dcdc6eCC" },
          dangerMovement: { background: "#c85f5aFF", boxShadow: "#dc736eCC" },
        },
      },
    },
    scope: "client",
    config: false, // Doesn't show up in config
  });

  // Define a settings submenu which handles advanced configuration needs
  game.settings.registerMenu("sw5eenhancedcombathud", "echThemeOptions", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.thememenu.name"),
    label: game.i18n.localize("sw5eenhancedcombathud.settings.thememenu.label"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.thememenu.hint"),
    icon: "fas fa-bars",
    type: echThemeOptions,
    restricted: false,
  });

  game.settings.register("sw5eenhancedcombathud", "rangefinder", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.rangefinder.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.rangefinder.hint"),
    scope: "world",
    config: true,
    type: String,
    choices: {
        "none": game.i18n.localize("sw5eenhancedcombathud.settings.rangefinder.choices.none"),
        "rangeOnly": game.i18n.localize("sw5eenhancedcombathud.settings.rangefinder.choices.rangeOnly"),
        "full": game.i18n.localize("sw5eenhancedcombathud.settings.rangefinder.choices.full"),
      },
    default: "rangeOnly",
});

  game.settings.register("sw5eenhancedcombathud", "scale", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.scale.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.scale.hint"),
    scope: "client",
    config: true,
    range: {
      min: 0.1,
      max: 1,
      step: 0.01,
    },
    type: Number,
    default: 0.5,
  });

  /*game.settings.register("sw5eenhancedcombathud", "noAutoscale", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.noAutoscale.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.noAutoscale.hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });*/

  game.settings.register("sw5eenhancedcombathud", "leftPos", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.leftPos.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.leftPos.hint"),
    scope: "client",
    config: true,
    type: Number,
    default: 15,
  });

  game.settings.register("sw5eenhancedcombathud", "botPos", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.botPos.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.botPos.hint"),
    scope: "client",
    config: true,
    type: Number,
    default: 15,
  });

  game.settings.register("sw5eenhancedcombathud", "hideMacroPlayers", {
    name: game.i18n.localize(
      "sw5eenhancedcombathud.settings.hideMacroPlayers.name"
    ),
    hint: game.i18n.localize(
      "sw5eenhancedcombathud.settings.hideMacroPlayers.hint"
    ),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: (sett) => {
      if(!sett){
        $("#players")[0].style.visibility = "visible";
        $("#hotbar").show(500);
      }
    },
  });

  game.settings.register("sw5eenhancedcombathud", "playerDetailsBottom", {
    name: game.i18n.localize(
      "sw5eenhancedcombathud.settings.playerDetailsBottom.name"
    ),
    hint: game.i18n.localize(
      "sw5eenhancedcombathud.settings.playerDetailsBottom.hint"
    ),
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("sw5eenhancedcombathud", "noAA", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.noAA.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.noAA.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("sw5eenhancedcombathud", "openCombatStart", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.openCombatStart.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.openCombatStart.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("sw5eenhancedcombathud", "preparedSpells", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.preparedSpells.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.preparedSpells.hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("sw5eenhancedcombathud", "showWeaponsItems", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.showWeaponsItems.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.showWeaponsItems.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("sw5eenhancedcombathud", "switchEquip", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.switchEquip.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.switchEquip.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("sw5eenhancedcombathud", "showTooltips", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.showTooltips.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.showTooltips.hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("sw5eenhancedcombathud", "tooltipScale", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.tooltipScale.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.tooltipScale.hint"),
    scope: "client",
    config: true,
    range: {
      min: 0.1,
      max: 1,
      step: 0.01,
    },
    type: Number,
    default: 1,
  });

  game.settings.register("sw5eenhancedcombathud", "showTooltipsSpecial", {
    name: game.i18n.localize(
      "sw5eenhancedcombathud.settings.showTooltipsSpecial.name"
    ),
    hint: game.i18n.localize(
      "sw5eenhancedcombathud.settings.showTooltipsSpecial.hint"
    ),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register(
    "sw5eenhancedcombathud",
    "showTooltipsAbilityMenuAbilities",
    {
      name: game.i18n.localize(
        "sw5eenhancedcombathud.settings.showTooltipsAbilityMenuAbilities.name"
      ),
      hint: game.i18n.localize(
        "sw5eenhancedcombathud.settings.showTooltipsAbilityMenuAbilities.hint"
      ),
      scope: "client",
      config: true,
      type: Boolean,
      default: true,
    }
  );
  game.settings.register("sw5eenhancedcombathud", "showTooltipsAbilityMenuSkills", {
    name: game.i18n.localize(
      "sw5eenhancedcombathud.settings.showTooltipsAbilityMenuSkills.name"
    ),
    hint: game.i18n.localize(
      "sw5eenhancedcombathud.settings.showTooltipsAbilityMenuSkills.hint"
    ),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register("sw5eenhancedcombathud", "showTooltipsAbilityMenuTools", {
    name: game.i18n.localize(
      "sw5eenhancedcombathud.settings.showTooltipsAbilityMenuTools.name"
    ),
    hint: game.i18n.localize(
      "sw5eenhancedcombathud.settings.showTooltipsAbilityMenuTools.hint"
    ),
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("sw5eenhancedcombathud", "fadeOutInactive", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.fadeOutInactive.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.fadeOutInactive.hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("sw5eenhancedcombathud", "fadeoutDelay", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.fadeoutDelay.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.fadeoutDelay.hint"),
    scope: "client",
    config: true,
    type: Number,
    default: 4,
  });

  game.settings.register("sw5eenhancedcombathud", "fadeoutOpacity", {
    name: game.i18n.localize("sw5eenhancedcombathud.settings.fadeoutOpacity.name"),
    hint: game.i18n.localize("sw5eenhancedcombathud.settings.fadeoutOpacity.hint"),
    scope: "client",
    config: true,
    type: Number,
    range: {
      min: 0,
      max: 1,
      step: 0.05,
    },
    default: 0.1,
  });
});

//Color Settings

Hooks.once("ready", function () {
  /*game.settings.set("sw5eenhancedcombathud", "echThemeData", {
    theme: 'custom',
    font: 'Roboto',
    colors: {
      "mainAction": {
        "base": {
          "background": "#414B55E6",
          "color": "#B4D2DCFF",
          "border": "#757f89FF"
        },
        "hover": {
          "background": "#747e88e6",
          "color": "#B4D2DCFF",
          "border": "#757f89FF"
        }
      },
      "bonusAction": {
        "base": {
          "background": "#453B75E6",
          "color": "#B4D2DCFF",
          "border": "#757f89FF"
        },
        "hover": {
          "background": "#9288c2e6",
          "color": "#B4D2DCFF",
          "border": "#757f89FF"
        }
      },
      "freeAction": {
        "base": {
          "background": "#3B5875E6",
          "color": "#B4D2DCFF",
          "border": "#757f89FF"
        },
        "hover": {
          "background": "#88a5c2e6",
          "color": "#B4D2DCFF",
          "border": "#757f89FF"
        }
      },
      "reaction": {
        "base": {
          "background": "#753B3BE6",
          "color": "#B4D2DCFF",
          "border": "#757f89FF"
        },
        "hover": {
          "background": "#c28888e6",
          "color": "#B4D2DCFF",
          "border": "#757f89FF"
        }
      },
      "endTurn": {
        "base": {
          "background": "#374B3CE6",
          "color": "#B4D2DCFF",
          "border": "#757f89FF"
        },
        "hover": {
          "background": "#849889e6",
          "color": "#B4D2DCFF",
          "border": "#757f89FF"
        }
      },
      "tooltip": {
        "header": {
          "background": "#ffffffCC",
          "color": "#414146",
          "border": "#757f89FF"
        },
        "subtitle": {
          "background": "#32505a",
          "color": "#ffffff",
          "border": "#757f89FF"
        },
        "body": {
          "background": "#5a7896B3",
          "color": "#ffffff",
          "border": "#757f89FF"
        }
      },
      "abilityMenu": {
        "background": "#414B55E6",
        "color": "#B4D2DCFF",
        "border": "#757f89FF",
        "base": { "color": "#B4D2DCFF", "boxShadow": "#757f89CC" },
        "hover": { "color": "#B4D2DCFF", "boxShadow": "#757f89CC" }
      },
      "buttons": {
        "base": {
          "background": "#5096c3",
          "color": "#ffffff",
          "border": "#5096c3"
        },
        "hover": {
          "background": "#55bef5",
          "color": "#ffffffff",
          "border": "#55bef5"
        }
      },
      "movement": {
        "used": { "background": "#7d879180", "boxShadow": "#00000000" },
        "baseMovement": { "background": "#5abef5FF", "boxShadow": "#6ed2ffCC" },
        "dashMovement": { "background": "#c8c85aFF", "boxShadow": "#dcdc6eCC" },
        "dangerMovement": { "background": "#c85f5aFF", "boxShadow": "#dc736eCC" }
      }
    }    
  })*/
});
/*
Hooks.on("renderItemSheet", (itemsheet, html) => {
  let actionType = itemsheet.object.system.activation.type;
  let itemType = itemsheet.object.data.type;
  let echFlags = itemsheet.object.data.flags.sw5eenhancedcombathud;

  // Constant function that returns formatted label
  const labelTemplate = (set) => {
    return `<label class="checkbox">
      <input type="checkbox" 
        ${echFlags?.[set] ? "checked" : ""} 
        name="flags.sw5eenhancedcombathud.${set}"> 
        ${game.i18n.localize("sw5eenhancedcombathud.itemconfig." + set + ".text")}
      </label>`;
  };

  const configHtmlElements = {
    start: `<div class="form-group stacked" id="test">
      <label>${game.i18n.localize(
        "sw5eenhancedcombathud.itemconfig.sets.text"
      )}</label>`,
    end: `</div>`,
  };

  let confightml = configHtmlElements.start;

  if (
    actionType === "action" ||
    itemType === "weapon" ||
    itemType === "consumable"
  ) {
    confightml += `<div class="form-fields">`;
    confightml += labelTemplate("set1p");
    confightml += labelTemplate("set2p");
    confightml += labelTemplate("set3p");
    confightml += `</div>`;
  }
  if (
    actionType === "bonus" ||
    itemType === "weapon" ||
    itemType === "equipment"
  ) {
    confightml += `<div class="form-fields">`;
    confightml += labelTemplate("set1s");
    confightml += labelTemplate("set2s");
    confightml += labelTemplate("set3s");
    confightml += `</div>`;
  }
  confightml += configHtmlElements.end;

  html.find('div[class="form-group stacked"]').first().before(confightml);
});
*/
Hooks.on("getSceneControlButtons", (controls, b, c) => {
  controls
    .find((x) => x.name == "token")
    .tools.push({
      active: canvas.hud?.sw5eenhancedcombathud?._state == 2,
      icon: "ech-swords",
      name: "echtoggle",
      title: game.i18n.localize("sw5eenhancedcombathud.controls.toggle.title"),
      onClick: function (toggle) {
        if(_token.document.actor.type == "vehicle") return
        if (toggle) {
          if (_token && canvas.tokens.get(_token.id) && _token.actor)
            canvas.hud.sw5eenhancedcombathud.bind(_token);
          else {
            this.active = false;
            ui.notifications.warn(
              game.i18n.localize("sw5eenhancedcombathud.controls.toggle.warning")
            );
          }
        } else {
          canvas.hud.sw5eenhancedcombathud.close();
        }

        $(".ech-swords").parent().toggleClass("active", toggle);
      },
      toggle: true,
    });
});
Hooks.on("renderTokenHUD", (app, html, data) => {
  let $tokenHUDButton = $(
    `<div class="control-icon echtoggle"><i class="ech-swords"></i></div>`
  );
  $tokenHUDButton.toggleClass(
    "active",
    $('.control-tool[data-tool="echtoggle"]').hasClass("active")
  );

  html.find(".col.left").prepend($tokenHUDButton);
  html.find(".col.left").on("click", ".control-icon.echtoggle", (event) => {
    $('.control-tool[data-tool="echtoggle"]').trigger("click");
  });
});

Handlebars.registerHelper("echLocalize", (data, data2, data3) => {
  let str = `.${data}`;
  if (typeof data2 == "string")
    str += `${data2.charAt(0).toUpperCase() + data2.slice(1)}`;
  if (typeof data3 == "string")
    str += `${data3.charAt(0).toUpperCase() + data3.slice(1)}`;

  return game.i18n.localize(`sw5eenhancedcombathud.themeOptions${str}`);
});

Handlebars.registerHelper("ifObject", function (item, options) {
  if (typeof item === "object") {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper("spellSlots", function (obj) {
  return CombatHudCanvasElement.generateSpells(obj);
});

Handlebars.registerHelper("hasUses", function (item) {
  let itemCount = 0;
  if (item.system.consume?.type) {
    switch (item.system.consume.type) {
      case "ammo":
        let ammoItem = canvas.hud.sw5eenhancedcombathud.hudData.actor.items.find(
          (i) => i.id == item.system.consume?.target
        );
        itemCount = ammoItem?.system?.quantity;
        break;
      case "attribute":
        let value = Object.byString(
          canvas.hud.sw5eenhancedcombathud.hudData.actor.system,
          item.system.consume.target
        );
        let resCount = value;
        itemCount = resCount;
        break;
    }
  } else {
    let uses = item.system.quantity || item.system.uses.value;
    itemCount = uses;
  }
  if (itemCount)
    return `class="feature-element has-count" data-item-count="${itemCount}"`;
  return `class="feature-element"`;
});

Handlebars.registerHelper("generateSavingThrows", (str) => {
  let data = canvas.hud.sw5eenhancedcombathud.hudData[str];
  let localize = canvas.hud.sw5eenhancedcombathud.hudData.settings.localize;
  let html = "";
  let prof = {
    0: "not-proficient",
    0.5: "half-proficiency",
    1: "proficient",
    2: "expertise",
  };

  if (Object.entries(data).length > 0) {
    html += `<li class="ability ability-title">${"Abilities"} <div><span>Check</span><span>Save</span></div></li>`;
  }

  for (let [key, value] of Object.entries(data)) {
    html += `<li class="ability is-${str.substring(
      0,
      str.length - 1
    )} proficiency-is-${prof[value.proficient]}" data-roll="${
      str == "tools" ? value.label : key
    }" data-modifier="save" >
        <span class="ability-name">${value.label}</span> 
        <div style="margin-left: auto;">
          <span data-type="check">${
            value.mod < 0 ? value.mod : "+" + value.mod
          }</span> 
          <span data-type="save">${
            value.save < 0 ? value.save : "+" + value.save
          }</span> 
        </div>
      </li>`;
  }

  return html;
});

Handlebars.registerHelper("generateAbilities", function (str) {
  let data = canvas.hud.sw5eenhancedcombathud.hudData[str];
  let localize = canvas.hud.sw5eenhancedcombathud.hudData.settings.localize;
  let html = "";
  let prof = {
    0: "not-proficient",
    0.5: "half-proficiency",
    1: "proficient",
    2: "expertise",
  };

  if (Object.entries(data).length > 0) {
    html += `<li class="ability ability-title">${localize[str]}</li>`;
  }

  for (let [key, value] of Object.entries(data)) {
    html += `<li class="ability is-${str.substring(
      0,
      str.length - 1
    )} proficiency-is-${prof[value.proficient]}" data-roll="${
      str == "tools" ? value.label : key
    }" data-modifier="${value.ability}" >
</span> <span class="ability-name">${
      value.label.label ?? value.label
    }</span> <span style="margin-left: auto;"><span class="ability-modifier" data-ability="${
      value.ability
    }" data-skill="${key}">${
      value.total < 0 ? value.total : "+" + value.total
    }</span> <span class="ability-passive">(${value.passive})</span></span>
      </li>`;
  }

  return html;
});

$("body").on("click", ".ability-menu .ability-toggle", (event) => {
  $("body").toggleClass("ech-show-ability-menu");
  let element = document.querySelector(".extended-combat-hud");
  let ratio = element.style.transform.split(" ")[0].replace(/[^0-9.]+/g, "");
  let scaleHeight =
    ($(window).height() - $(".portrait-hud").outerHeight() * ratio) / ratio -
    70;
  $(".ability-menu ul")
    .first()
    .css({
      "max-height": $("body").hasClass("ech-show-ability-menu")
        ? `${scaleHeight}px`
        : "0px",
    });
});
$("body").on("click", "#echThemeOptions li h4.toggleOptions", (event) => {
  let isOpened = $(event.currentTarget).closest("li").hasClass("show");

  $(event.currentTarget).closest("ul").find("li.show").removeClass("show");
  $(event.currentTarget).closest("li").toggleClass("show", !isOpened);
});

Hooks.on("canvasReady", function () {
  canvas.hud.sw5eenhancedcombathud?.close();
  $(".extended-combat-hud").remove();
});

Object.byString = function (o, s) {
  s = s.replace(/\[(\w+)\]/g, ".$1"); // convert indexes to properties
  s = s.replace(/^\./, ""); // strip a leading dot
  var a = s.split(".");
  for (var i = 0, n = a.length; i < n; ++i) {
    var k = a[i];
    if (k in o) {
      o = o[k];
    } else {
      return;
    }
  }
  return o;
};
