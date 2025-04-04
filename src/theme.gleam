import gleam_community/colour
import nord

pub type ThemeColor {
  Black
  Background
  Text
  TextSoft
  TextSofter
  TextError
  TextSuccess
  Accent
  ButtonBgPrimary
  ButtonBgPrimaryDisabled
  ButtonBgSecondary
  ButtonBgSecondaryDisabled
  ButtonBgWarn
  ButtonBgWarnDisabled
  ButtonBgDanger
  ButtonBgDangerDisabled
  ButtonTextPrimary
  ButtonTextPrimaryDisabled
  ButtonTextSecondary
  ButtonTextSecondaryDisabled
  ButtonTextWarn
  ButtonTextWarnDisabled
  ButtonTextDanger
  ButtonTextDangerDisabled
  CardBackground
  CardBackgroundPrimary
  CardBackgroundSecondary
  CardBackgroundWarn
  CardBackgroundDanger
  Border
  BorderSoft
  BorderSofter
  InputBg
}

pub fn color(theme_color: ThemeColor) -> String {
  let color =
    case theme_color {
      Black -> colour.black
      Background -> nord.color(nord.Nord1)
      Text -> nord.color(nord.Nord4)
      TextSoft -> nord.color(nord.Nord5)
      TextSofter -> nord.color(nord.Nord6)
      TextError -> nord.color(nord.Nord11)
      TextSuccess -> nord.color(nord.Nord12)
      Accent -> nord.color(nord.Nord10)
      ButtonBgPrimary -> nord.color(nord.Nord10)
      ButtonBgPrimaryDisabled ->
        nord.color(nord.Nord10)
        |> disabled_bg
      ButtonBgSecondary -> nord.color(nord.Nord4)
      ButtonBgSecondaryDisabled -> nord.color(nord.Nord4)
      ButtonBgWarn -> nord.color(nord.Nord11)
      ButtonBgWarnDisabled -> nord.color(nord.Nord11)
      ButtonBgDanger -> nord.color(nord.Nord13)
      ButtonBgDangerDisabled -> nord.color(nord.Nord13)
      ButtonTextPrimary -> nord.color(nord.Nord4)
      ButtonTextPrimaryDisabled ->
        nord.color(nord.Nord4)
        |> disabled_text
      ButtonTextSecondary -> nord.color(nord.Nord0)
      ButtonTextSecondaryDisabled -> nord.color(nord.Nord0)
      ButtonTextWarn -> nord.color(nord.Nord4)
      ButtonTextWarnDisabled -> nord.color(nord.Nord9)
      ButtonTextDanger -> nord.color(nord.Nord13)
      ButtonTextDangerDisabled -> nord.color(nord.Nord13)
      CardBackground -> nord.color(nord.Nord2)
      CardBackgroundPrimary -> nord.color(nord.Nord1)
      CardBackgroundSecondary -> nord.color(nord.Nord2)
      CardBackgroundWarn -> nord.color(nord.Nord11)
      CardBackgroundDanger -> nord.color(nord.Nord13)
      Border -> nord.color(nord.Nord3)
      BorderSoft -> nord.color(nord.Nord5)
      BorderSofter -> nord.color(nord.Nord6)
      InputBg -> nord.color(nord.Nord0)
    }
    |> colour.to_rgba_hex_string

  "#" <> color
}

fn adjust_lightness(color: colour.Colour, value: Float) -> colour.Colour {
  let hsla = colour.to_hsla(color)
  let color = colour.from_hsla(hsla.0, hsla.1, hsla.2 +. value, hsla.3)
  let assert Ok(final_color) = color

  final_color
}

fn adjust_saturation(color: colour.Colour, value: Float) -> colour.Colour {
  let hsla = colour.to_hsla(color)
  let color = colour.from_hsla(hsla.0, hsla.1 +. value, hsla.2, hsla.3)
  let assert Ok(final_color) = color

  final_color
}

fn disabled_bg(color: colour.Colour) -> colour.Colour {
  color
  |> adjust_lightness(-0.15)
  |> adjust_saturation(-0.03)
}

fn disabled_text(color: colour.Colour) -> colour.Colour {
  color
  |> adjust_lightness(-0.3)
}
