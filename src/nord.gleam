import gleam/result
import gleam_community/colour

pub type Nord {
  Nord(
    nord0: colour.Colour,
    nord1: colour.Colour,
    nord2: colour.Colour,
    nord3: colour.Colour,
    nord4: colour.Colour,
    nord5: colour.Colour,
    nord6: colour.Colour,
    nord7: colour.Colour,
    nord8: colour.Colour,
    nord9: colour.Colour,
    nord10: colour.Colour,
    nord11: colour.Colour,
    nord12: colour.Colour,
    nord13: colour.Colour,
    nord14: colour.Colour,
    nord15: colour.Colour,
  )
}

pub type NodeColor {
  Nord0
  Nord1
  Nord2
  Nord3
  Nord4
  Nord5
  Nord6
  Nord7
  Nord8
  Nord9
  Nord10
  Nord11
  Nord12
  Nord13
  Nord14
  Nord15
}

fn nord() -> Nord {
  Nord(
    nord0: result.unwrap(colour.from_rgba_hex(0x2e3440), colour.red),
    nord1: result.unwrap(colour.from_rgba_hex(0x3b4252), colour.red),
    nord2: result.unwrap(colour.from_rgba_hex(0x434c5e), colour.red),
    nord3: result.unwrap(colour.from_rgba_hex(0x4c566a), colour.red),
    nord4: result.unwrap(colour.from_rgba_hex(0xd8dee9), colour.red),
    nord5: result.unwrap(colour.from_rgba_hex(0xe5e9f0), colour.red),
    nord6: result.unwrap(colour.from_rgba_hex(0xeceff4), colour.red),
    nord7: result.unwrap(colour.from_rgba_hex(0x8fbcbb), colour.red),
    nord8: result.unwrap(colour.from_rgba_hex(0x88c0d0), colour.red),
    nord9: result.unwrap(colour.from_rgba_hex(0x81a1c1), colour.red),
    nord10: result.unwrap(colour.from_rgba_hex(0x5e81ac), colour.red),
    nord11: result.unwrap(colour.from_rgba_hex(0xbf616a), colour.red),
    nord12: result.unwrap(colour.from_rgba_hex(0xd08770), colour.red),
    nord13: result.unwrap(colour.from_rgba_hex(0xebcb8b), colour.red),
    nord14: result.unwrap(colour.from_rgba_hex(0xa3be8c), colour.red),
    nord15: result.unwrap(colour.from_rgba_hex(0xb48ead), colour.red),
  )
}

pub fn color(node_color: NodeColor) -> colour.Colour {
  let nord = nord()
  case node_color {
    Nord0 -> nord.nord0
    Nord1 -> nord.nord1
    Nord2 -> nord.nord2
    Nord3 -> nord.nord3
    Nord4 -> nord.nord4
    Nord5 -> nord.nord5
    Nord6 -> nord.nord6
    Nord7 -> nord.nord7
    Nord8 -> nord.nord8
    Nord9 -> nord.nord9
    Nord10 -> nord.nord10
    Nord11 -> nord.nord11
    Nord12 -> nord.nord12
    Nord13 -> nord.nord13
    Nord14 -> nord.nord14
    Nord15 -> nord.nord15
  }
}
