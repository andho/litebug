import gleam_community/colour
import nord

pub type ThemeColor {
  Background
  Text
  TextSoft
  TextSofter
  Accent
  ButtonBgPrimary
  ButtonBgSecondary
  ButtonBgWarn
  ButtonBgDanger
  ButtonTextPrimary
  ButtonTextSecondary
  ButtonTextWarn
  ButtonTextDanger
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
      Background -> nord.color(nord.Nord1)
      Text -> nord.color(nord.Nord4)
      TextSoft -> nord.color(nord.Nord5)
      TextSofter -> nord.color(nord.Nord6)
      Accent -> nord.color(nord.Nord10)
      ButtonBgPrimary -> nord.color(nord.Nord10)
      ButtonBgSecondary -> nord.color(nord.Nord4)
      ButtonBgWarn -> nord.color(nord.Nord11)
      ButtonBgDanger -> nord.color(nord.Nord13)
      ButtonTextPrimary -> nord.color(nord.Nord4)
      ButtonTextSecondary -> nord.color(nord.Nord0)
      ButtonTextWarn -> nord.color(nord.Nord9)
      ButtonTextDanger -> nord.color(nord.Nord13)
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
