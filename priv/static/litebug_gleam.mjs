// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label) => label in fields ? fields[label] : this[label]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current)
      current = current.tail;
    return current !== void 0;
  }
  // @internal
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current)
      current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  // @internal
  countLength() {
    let current = this;
    let length5 = 0;
    while (current) {
      current = current.tail;
      length5++;
    }
    return length5 - 1;
  }
};
function prepend(element3, tail) {
  return new NonEmpty(element3, tail);
}
function toList(elements2, tail) {
  return List.fromArray(elements2, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class {
  /**
   * The size in bits of this bit array's data.
   *
   * @type {number}
   */
  bitSize;
  /**
   * The size in bytes of this bit array's data. If this bit array doesn't store
   * a whole number of bytes then this value is rounded up.
   *
   * @type {number}
   */
  byteSize;
  /**
   * The number of unused high bits in the first byte of this bit array's
   * buffer prior to the start of its data. The value of any unused high bits is
   * undefined.
   *
   * The bit offset will be in the range 0-7.
   *
   * @type {number}
   */
  bitOffset;
  /**
   * The raw bytes that hold this bit array's data.
   *
   * If `bitOffset` is not zero then there are unused high bits in the first
   * byte of this buffer.
   *
   * If `bitOffset + bitSize` is not a multiple of 8 then there are unused low
   * bits in the last byte of this buffer.
   *
   * @type {Uint8Array}
   */
  rawBuffer;
  /**
   * Constructs a new bit array from a `Uint8Array`, an optional size in
   * bits, and an optional bit offset.
   *
   * If no bit size is specified it is taken as `buffer.length * 8`, i.e. all
   * bytes in the buffer make up the new bit array's data.
   *
   * If no bit offset is specified it defaults to zero, i.e. there are no unused
   * high bits in the first byte of the buffer.
   *
   * @param {Uint8Array} buffer
   * @param {number} [bitSize]
   * @param {number} [bitOffset]
   */
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error(
        "BitArray can only be constructed from a Uint8Array"
      );
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(
        `BitArray bit offset is invalid: ${this.bitOffset}`
      );
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  /**
   * Returns a specific byte in this bit array. If the byte index is out of
   * range then `undefined` is returned.
   *
   * When returning the final byte of a bit array with a bit size that's not a
   * multiple of 8, the content of the unused low bits are undefined.
   *
   * @param {number} index
   * @returns {number | undefined}
   */
  byteAt(index6) {
    if (index6 < 0 || index6 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index6);
  }
  /** @internal */
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0; i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < wholeByteCount; i++) {
        const a = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a = bitArrayByteAt(
          this.rawBuffer,
          this.bitOffset,
          wholeByteCount
        );
        const b = bitArrayByteAt(
          other.rawBuffer,
          other.bitOffset,
          wholeByteCount
        );
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Returns this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.byteAt()` or `BitArray.rawBuffer` instead.
   *
   * @returns {Uint8Array}
   */
  get buffer() {
    bitArrayPrintDeprecationWarning(
      "buffer",
      "Use BitArray.byteAt() or BitArray.rawBuffer instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.buffer does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer;
  }
  /**
   * Returns the length in bytes of this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.bitSize` or `BitArray.byteSize` instead.
   *
   * @returns {number}
   */
  get length() {
    bitArrayPrintDeprecationWarning(
      "length",
      "Use BitArray.bitSize or BitArray.byteSize instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.length does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer.length;
  }
};
function bitArrayByteAt(buffer, bitOffset, index6) {
  if (bitOffset === 0) {
    return buffer[index6] ?? 0;
  } else {
    const a = buffer[index6] << bitOffset & 255;
    const b = buffer[index6 + 1] >> 8 - bitOffset;
    return a | b;
  }
}
var UtfCodepoint = class {
  constructor(value2) {
    this.value = value2;
  }
};
var isBitArrayDeprecationMessagePrinted = {};
function bitArrayPrintDeprecationWarning(name, message) {
  if (isBitArrayDeprecationMessagePrinted[name]) {
    return;
  }
  console.warn(
    `Deprecated BitArray.${name} property used in JavaScript FFI code. ${message}.`
  );
  isBitArrayDeprecationMessagePrinted[name] = true;
}
function bitArraySlice(bitArray, start3, end) {
  end ??= bitArray.bitSize;
  bitArrayValidateRange(bitArray, start3, end);
  if (start3 === end) {
    return new BitArray(new Uint8Array());
  }
  if (start3 === 0 && end === bitArray.bitSize) {
    return bitArray;
  }
  start3 += bitArray.bitOffset;
  end += bitArray.bitOffset;
  const startByteIndex = Math.trunc(start3 / 8);
  const endByteIndex = Math.trunc((end + 7) / 8);
  const byteLength = endByteIndex - startByteIndex;
  let buffer;
  if (startByteIndex === 0 && byteLength === bitArray.rawBuffer.byteLength) {
    buffer = bitArray.rawBuffer;
  } else {
    buffer = new Uint8Array(
      bitArray.rawBuffer.buffer,
      bitArray.rawBuffer.byteOffset + startByteIndex,
      byteLength
    );
  }
  return new BitArray(buffer, end - start3, start3 % 8);
}
function bitArraySliceToInt(bitArray, start3, end, isBigEndian, isSigned) {
  bitArrayValidateRange(bitArray, start3, end);
  if (start3 === end) {
    return 0;
  }
  start3 += bitArray.bitOffset;
  end += bitArray.bitOffset;
  const isStartByteAligned = start3 % 8 === 0;
  const isEndByteAligned = end % 8 === 0;
  if (isStartByteAligned && isEndByteAligned) {
    return intFromAlignedSlice(
      bitArray,
      start3 / 8,
      end / 8,
      isBigEndian,
      isSigned
    );
  }
  const size = end - start3;
  const startByteIndex = Math.trunc(start3 / 8);
  const endByteIndex = Math.trunc((end - 1) / 8);
  if (startByteIndex == endByteIndex) {
    const mask2 = 255 >> start3 % 8;
    const unusedLowBitCount = (8 - end % 8) % 8;
    let value2 = (bitArray.rawBuffer[startByteIndex] & mask2) >> unusedLowBitCount;
    if (isSigned) {
      const highBit = 2 ** (size - 1);
      if (value2 >= highBit) {
        value2 -= highBit * 2;
      }
    }
    return value2;
  }
  if (size <= 53) {
    return intFromUnalignedSliceUsingNumber(
      bitArray.rawBuffer,
      start3,
      end,
      isBigEndian,
      isSigned
    );
  } else {
    return intFromUnalignedSliceUsingBigInt(
      bitArray.rawBuffer,
      start3,
      end,
      isBigEndian,
      isSigned
    );
  }
}
function toBitArray(segments) {
  if (segments.length === 0) {
    return new BitArray(new Uint8Array());
  }
  if (segments.length === 1) {
    const segment = segments[0];
    if (segment instanceof BitArray) {
      return segment;
    }
    if (segment instanceof Uint8Array) {
      return new BitArray(segment);
    }
    return new BitArray(new Uint8Array(
      /** @type {number[]} */
      segments
    ));
  }
  let bitSize = 0;
  let areAllSegmentsNumbers = true;
  for (const segment of segments) {
    if (segment instanceof BitArray) {
      bitSize += segment.bitSize;
      areAllSegmentsNumbers = false;
    } else if (segment instanceof Uint8Array) {
      bitSize += segment.byteLength * 8;
      areAllSegmentsNumbers = false;
    } else {
      bitSize += 8;
    }
  }
  if (areAllSegmentsNumbers) {
    return new BitArray(new Uint8Array(
      /** @type {number[]} */
      segments
    ));
  }
  const buffer = new Uint8Array(Math.trunc((bitSize + 7) / 8));
  let cursor = 0;
  for (let segment of segments) {
    const isCursorByteAligned = cursor % 8 === 0;
    if (segment instanceof BitArray) {
      if (isCursorByteAligned && segment.bitOffset === 0) {
        buffer.set(segment.rawBuffer, cursor / 8);
        cursor += segment.bitSize;
        const trailingBitsCount = segment.bitSize % 8;
        if (trailingBitsCount !== 0) {
          const lastByteIndex = Math.trunc(cursor / 8);
          buffer[lastByteIndex] >>= 8 - trailingBitsCount;
          buffer[lastByteIndex] <<= 8 - trailingBitsCount;
        }
      } else {
        appendUnalignedBits(
          segment.rawBuffer,
          segment.bitSize,
          segment.bitOffset
        );
      }
    } else if (segment instanceof Uint8Array) {
      if (isCursorByteAligned) {
        buffer.set(segment, cursor / 8);
        cursor += segment.byteLength * 8;
      } else {
        appendUnalignedBits(segment, segment.byteLength * 8, 0);
      }
    } else {
      if (isCursorByteAligned) {
        buffer[cursor / 8] = segment;
        cursor += 8;
      } else {
        appendUnalignedBits(new Uint8Array([segment]), 8, 0);
      }
    }
  }
  function appendUnalignedBits(unalignedBits, size, offset) {
    if (size === 0) {
      return;
    }
    const byteSize = Math.trunc(size + 7 / 8);
    const highBitsCount = cursor % 8;
    const lowBitsCount = 8 - highBitsCount;
    let byteIndex = Math.trunc(cursor / 8);
    for (let i = 0; i < byteSize; i++) {
      let byte = bitArrayByteAt(unalignedBits, offset, i);
      if (size < 8) {
        byte >>= 8 - size;
        byte <<= 8 - size;
      }
      buffer[byteIndex] |= byte >> highBitsCount;
      let appendedBitsCount = size - Math.max(0, size - lowBitsCount);
      size -= appendedBitsCount;
      cursor += appendedBitsCount;
      if (size === 0) {
        break;
      }
      buffer[++byteIndex] = byte << lowBitsCount;
      appendedBitsCount = size - Math.max(0, size - highBitsCount);
      size -= appendedBitsCount;
      cursor += appendedBitsCount;
    }
  }
  return new BitArray(buffer, bitSize);
}
function sizedInt(value2, size, isBigEndian) {
  if (size <= 0) {
    return new Uint8Array();
  }
  if (size === 8) {
    return new Uint8Array([value2]);
  }
  if (size < 8) {
    value2 <<= 8 - size;
    return new BitArray(new Uint8Array([value2]), size);
  }
  const buffer = new Uint8Array(Math.trunc((size + 7) / 8));
  const trailingBitsCount = size % 8;
  const unusedBitsCount = 8 - trailingBitsCount;
  if (size <= 32) {
    if (isBigEndian) {
      let i = buffer.length - 1;
      if (trailingBitsCount) {
        buffer[i--] = value2 << unusedBitsCount & 255;
        value2 >>= trailingBitsCount;
      }
      for (; i >= 0; i--) {
        buffer[i] = value2;
        value2 >>= 8;
      }
    } else {
      let i = 0;
      const wholeByteCount = Math.trunc(size / 8);
      for (; i < wholeByteCount; i++) {
        buffer[i] = value2;
        value2 >>= 8;
      }
      if (trailingBitsCount) {
        buffer[i] = value2 << unusedBitsCount;
      }
    }
  } else {
    const bigTrailingBitsCount = BigInt(trailingBitsCount);
    const bigUnusedBitsCount = BigInt(unusedBitsCount);
    let bigValue = BigInt(value2);
    if (isBigEndian) {
      let i = buffer.length - 1;
      if (trailingBitsCount) {
        buffer[i--] = Number(bigValue << bigUnusedBitsCount);
        bigValue >>= bigTrailingBitsCount;
      }
      for (; i >= 0; i--) {
        buffer[i] = Number(bigValue);
        bigValue >>= 8n;
      }
    } else {
      let i = 0;
      const wholeByteCount = Math.trunc(size / 8);
      for (; i < wholeByteCount; i++) {
        buffer[i] = Number(bigValue);
        bigValue >>= 8n;
      }
      if (trailingBitsCount) {
        buffer[i] = Number(bigValue << bigUnusedBitsCount);
      }
    }
  }
  if (trailingBitsCount) {
    return new BitArray(buffer, size);
  }
  return buffer;
}
function intFromAlignedSlice(bitArray, start3, end, isBigEndian, isSigned) {
  const byteSize = end - start3;
  if (byteSize <= 6) {
    return intFromAlignedSliceUsingNumber(
      bitArray.rawBuffer,
      start3,
      end,
      isBigEndian,
      isSigned
    );
  } else {
    return intFromAlignedSliceUsingBigInt(
      bitArray.rawBuffer,
      start3,
      end,
      isBigEndian,
      isSigned
    );
  }
}
function intFromAlignedSliceUsingNumber(buffer, start3, end, isBigEndian, isSigned) {
  const byteSize = end - start3;
  let value2 = 0;
  if (isBigEndian) {
    for (let i = start3; i < end; i++) {
      value2 *= 256;
      value2 += buffer[i];
    }
  } else {
    for (let i = end - 1; i >= start3; i--) {
      value2 *= 256;
      value2 += buffer[i];
    }
  }
  if (isSigned) {
    const highBit = 2 ** (byteSize * 8 - 1);
    if (value2 >= highBit) {
      value2 -= highBit * 2;
    }
  }
  return value2;
}
function intFromAlignedSliceUsingBigInt(buffer, start3, end, isBigEndian, isSigned) {
  const byteSize = end - start3;
  let value2 = 0n;
  if (isBigEndian) {
    for (let i = start3; i < end; i++) {
      value2 *= 256n;
      value2 += BigInt(buffer[i]);
    }
  } else {
    for (let i = end - 1; i >= start3; i--) {
      value2 *= 256n;
      value2 += BigInt(buffer[i]);
    }
  }
  if (isSigned) {
    const highBit = 1n << BigInt(byteSize * 8 - 1);
    if (value2 >= highBit) {
      value2 -= highBit * 2n;
    }
  }
  return Number(value2);
}
function intFromUnalignedSliceUsingNumber(buffer, start3, end, isBigEndian, isSigned) {
  const isStartByteAligned = start3 % 8 === 0;
  let size = end - start3;
  let byteIndex = Math.trunc(start3 / 8);
  let value2 = 0;
  if (isBigEndian) {
    if (!isStartByteAligned) {
      const leadingBitsCount = 8 - start3 % 8;
      value2 = buffer[byteIndex++] & (1 << leadingBitsCount) - 1;
      size -= leadingBitsCount;
    }
    while (size >= 8) {
      value2 *= 256;
      value2 += buffer[byteIndex++];
      size -= 8;
    }
    if (size > 0) {
      value2 *= 2 ** size;
      value2 += buffer[byteIndex] >> 8 - size;
    }
  } else {
    if (isStartByteAligned) {
      let size2 = end - start3;
      let scale = 1;
      while (size2 >= 8) {
        value2 += buffer[byteIndex++] * scale;
        scale *= 256;
        size2 -= 8;
      }
      value2 += (buffer[byteIndex] >> 8 - size2) * scale;
    } else {
      const highBitsCount = start3 % 8;
      const lowBitsCount = 8 - highBitsCount;
      let size2 = end - start3;
      let scale = 1;
      while (size2 >= 8) {
        const byte = buffer[byteIndex] << highBitsCount | buffer[byteIndex + 1] >> lowBitsCount;
        value2 += (byte & 255) * scale;
        scale *= 256;
        size2 -= 8;
        byteIndex++;
      }
      if (size2 > 0) {
        const lowBitsUsed = size2 - Math.max(0, size2 - lowBitsCount);
        let trailingByte = (buffer[byteIndex] & (1 << lowBitsCount) - 1) >> lowBitsCount - lowBitsUsed;
        size2 -= lowBitsUsed;
        if (size2 > 0) {
          trailingByte *= 2 ** size2;
          trailingByte += buffer[byteIndex + 1] >> 8 - size2;
        }
        value2 += trailingByte * scale;
      }
    }
  }
  if (isSigned) {
    const highBit = 2 ** (end - start3 - 1);
    if (value2 >= highBit) {
      value2 -= highBit * 2;
    }
  }
  return value2;
}
function intFromUnalignedSliceUsingBigInt(buffer, start3, end, isBigEndian, isSigned) {
  const isStartByteAligned = start3 % 8 === 0;
  let size = end - start3;
  let byteIndex = Math.trunc(start3 / 8);
  let value2 = 0n;
  if (isBigEndian) {
    if (!isStartByteAligned) {
      const leadingBitsCount = 8 - start3 % 8;
      value2 = BigInt(buffer[byteIndex++] & (1 << leadingBitsCount) - 1);
      size -= leadingBitsCount;
    }
    while (size >= 8) {
      value2 *= 256n;
      value2 += BigInt(buffer[byteIndex++]);
      size -= 8;
    }
    if (size > 0) {
      value2 <<= BigInt(size);
      value2 += BigInt(buffer[byteIndex] >> 8 - size);
    }
  } else {
    if (isStartByteAligned) {
      let size2 = end - start3;
      let shift = 0n;
      while (size2 >= 8) {
        value2 += BigInt(buffer[byteIndex++]) << shift;
        shift += 8n;
        size2 -= 8;
      }
      value2 += BigInt(buffer[byteIndex] >> 8 - size2) << shift;
    } else {
      const highBitsCount = start3 % 8;
      const lowBitsCount = 8 - highBitsCount;
      let size2 = end - start3;
      let shift = 0n;
      while (size2 >= 8) {
        const byte = buffer[byteIndex] << highBitsCount | buffer[byteIndex + 1] >> lowBitsCount;
        value2 += BigInt(byte & 255) << shift;
        shift += 8n;
        size2 -= 8;
        byteIndex++;
      }
      if (size2 > 0) {
        const lowBitsUsed = size2 - Math.max(0, size2 - lowBitsCount);
        let trailingByte = (buffer[byteIndex] & (1 << lowBitsCount) - 1) >> lowBitsCount - lowBitsUsed;
        size2 -= lowBitsUsed;
        if (size2 > 0) {
          trailingByte <<= size2;
          trailingByte += buffer[byteIndex + 1] >> 8 - size2;
        }
        value2 += BigInt(trailingByte) << shift;
      }
    }
  }
  if (isSigned) {
    const highBit = 2n ** BigInt(end - start3 - 1);
    if (value2 >= highBit) {
      value2 -= highBit * 2n;
    }
  }
  return Number(value2);
}
function bitArrayValidateRange(bitArray, start3, end) {
  if (start3 < 0 || start3 > bitArray.bitSize || end < start3 || end > bitArray.bitSize) {
    const msg = `Invalid bit array slice: start = ${start3}, end = ${end}, bit size = ${bitArray.bitSize}`;
    throw new globalThis.Error(msg);
  }
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value2) {
    super();
    this[0] = value2;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values2 = [x, y];
  while (values2.length) {
    let a = values2.pop();
    let b = values2.pop();
    if (a === b)
      continue;
    if (!isObject(a) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b))
          continue;
        else
          return false;
      } catch {
      }
    }
    let [keys2, get2] = getters(a);
    for (let k of keys2(a)) {
      values2.push(get2(a, k), get2(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return !(a instanceof BitArray) && a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c))
    return false;
  return a.constructor === b.constructor;
}
function makeError(variant, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra)
    error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var None = class extends CustomType {
};
function to_result(option, e) {
  if (option instanceof Some) {
    let a = option[0];
    return new Ok(a);
  } else {
    return new Error(e);
  }
}
function unwrap(option, default$) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return default$;
  }
}
function lazy_unwrap(option, default$) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return default$();
  }
}
function map(option, fun) {
  if (option instanceof Some) {
    let x = option[0];
    return new Some(fun(x));
  } else {
    return new None();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/pair.mjs
function first(pair) {
  let a = pair[0];
  return a;
}
function second(pair) {
  let a = pair[1];
  return a;
}
function map_second(pair, fun) {
  let a = pair[0];
  let b = pair[1];
  return [a, fun(b)];
}
function new$(first4, second2) {
  return [first4, second2];
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix.hasLength(0)) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list4) {
  return reverse_and_prepend(list4, toList([]));
}
function is_empty(list4) {
  return isEqual(list4, toList([]));
}
function first2(list4) {
  if (list4.hasLength(0)) {
    return new Error(void 0);
  } else {
    let first$1 = list4.head;
    return new Ok(first$1);
  }
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map2(list4, fun) {
  return map_loop(list4, fun, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first4 = loop$first;
    let second2 = loop$second;
    if (first4.hasLength(0)) {
      return second2;
    } else {
      let first$1 = first4.head;
      let rest$1 = first4.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second2);
    }
  }
}
function append(first4, second2) {
  return append_loop(reverse(first4), second2);
}
function prepend2(list4, item) {
  return prepend(item, list4);
}
function flatten_loop(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists.hasLength(0)) {
      return reverse(acc);
    } else {
      let list4 = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend(list4, acc);
    }
  }
}
function flatten(lists) {
  return flatten_loop(lists, toList([]));
}
function flat_map(list4, fun) {
  let _pipe = map2(list4, fun);
  return flatten(_pipe);
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list4.hasLength(0)) {
      return initial;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function index_fold_loop(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc = loop$acc;
    let with$ = loop$with;
    let index6 = loop$index;
    if (over.hasLength(0)) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index6);
      loop$with = with$;
      loop$index = index6 + 1;
    }
  }
}
function index_fold(list4, initial, fun) {
  return index_fold_loop(list4, initial, fun, 0);
}
function intersperse_loop(loop$list, loop$separator, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let separator = loop$separator;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$separator = separator;
      loop$acc = prepend(first$1, prepend(separator, acc));
    }
  }
}
function intersperse(list4, elem) {
  if (list4.hasLength(0)) {
    return list4;
  } else if (list4.hasLength(1)) {
    return list4;
  } else {
    let first$1 = list4.head;
    let rest$1 = list4.tail;
    return intersperse_loop(rest$1, elem, toList([first$1]));
  }
}

// build/dev/javascript/gleam_stdlib/gleam/string_tree.mjs
function append2(tree, second2) {
  return add(tree, identity(second2));
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function replace(string7, pattern, substitute) {
  let _pipe = string7;
  let _pipe$1 = identity(_pipe);
  let _pipe$2 = string_replace(_pipe$1, pattern, substitute);
  return identity(_pipe$2);
}
function append3(first4, second2) {
  let _pipe = first4;
  let _pipe$1 = identity(_pipe);
  let _pipe$2 = append2(_pipe$1, second2);
  return identity(_pipe$2);
}
function concat2(strings) {
  let _pipe = strings;
  let _pipe$1 = concat(_pipe);
  return identity(_pipe$1);
}
function repeat_loop(loop$string, loop$times, loop$acc) {
  while (true) {
    let string7 = loop$string;
    let times = loop$times;
    let acc = loop$acc;
    let $ = times <= 0;
    if ($) {
      return acc;
    } else {
      loop$string = string7;
      loop$times = times - 1;
      loop$acc = acc + string7;
    }
  }
}
function repeat(string7, times) {
  return repeat_loop(string7, times, "");
}
function drop_start(loop$string, loop$num_graphemes) {
  while (true) {
    let string7 = loop$string;
    let num_graphemes = loop$num_graphemes;
    let $ = num_graphemes > 0;
    if (!$) {
      return string7;
    } else {
      let $1 = pop_grapheme(string7);
      if ($1.isOk()) {
        let string$1 = $1[0][1];
        loop$string = string$1;
        loop$num_graphemes = num_graphemes - 1;
      } else {
        return string7;
      }
    }
  }
}
function inspect2(term) {
  let _pipe = inspect(term);
  return identity(_pipe);
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map3(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function flatten2(result) {
  if (result.isOk()) {
    let x = result[0];
    return x;
  } else {
    let error = result[0];
    return new Error(error);
  }
}
function try$(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function then$(result, fun) {
  return try$(result, fun);
}
function unwrap_both(result) {
  if (result.isOk()) {
    let a = result[0];
    return a;
  } else {
    let a = result[0];
    return a;
  }
}
function replace_error(result, error) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    return new Error(error);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
function string2(data) {
  return decode_string(data);
}
function int(data) {
  return decode_int(data);
}
function do_any(decoders) {
  return (data) => {
    if (decoders.hasLength(0)) {
      return new Error(
        toList([new DecodeError("another type", classify_dynamic(data), toList([]))])
      );
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder(data);
      if ($.isOk()) {
        let decoded = $[0];
        return new Ok(decoded);
      } else {
        return do_any(decoders$1)(data);
      }
    }
  };
}
function any(decoders) {
  return do_any(decoders);
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = new DataView(new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash3 = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash3);
  return hash3;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash3 = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash3 = Math.imul(31, hash3) + s.charCodeAt(i) | 0;
  }
  return hash3;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code2 = o.hashCode(o);
      if (typeof code2 === "number") {
        return code2;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === void 0)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash3, shift) {
  return hash3 >>> shift & MASK;
}
function bitpos(hash3, shift) {
  return 1 << mask(hash3, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key22, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key22, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key22,
    val2,
    addedLeaf
  );
}
function assoc(root, shift, hash3, key3, val, addedLeaf) {
  switch (root.type) {
    case ARRAY_NODE:
      return assocArray(root, shift, hash3, key3, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root, shift, hash3, key3, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root, shift, hash3, key3, val, addedLeaf);
  }
}
function assocArray(root, shift, hash3, key3, val, addedLeaf) {
  const idx = mask(hash3, shift);
  const node2 = root.array[idx];
  if (node2 === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size + 1,
      array: cloneAndSet(root.array, idx, { type: ENTRY, k: key3, v: val })
    };
  }
  if (node2.type === ENTRY) {
    if (isEqual(key3, node2.k)) {
      if (val === node2.v) {
        return root;
      }
      return {
        type: ARRAY_NODE,
        size: root.size,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key3,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, node2.k, node2.v, hash3, key3, val)
      )
    };
  }
  const n = assoc(node2, shift + SHIFT, hash3, key3, val, addedLeaf);
  if (n === node2) {
    return root;
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function assocIndex(root, shift, hash3, key3, val, addedLeaf) {
  const bit = bitpos(hash3, shift);
  const idx = index(root.bitmap, bit);
  if ((root.bitmap & bit) !== 0) {
    const node2 = root.array[idx];
    if (node2.type !== ENTRY) {
      const n = assoc(node2, shift + SHIFT, hash3, key3, val, addedLeaf);
      if (n === node2) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    const nodeKey = node2.k;
    if (isEqual(key3, nodeKey)) {
      if (val === node2.v) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key3,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node2.v, hash3, key3, val)
      )
    };
  } else {
    const n = root.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash3, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash3, key3, val, addedLeaf);
      let j = 0;
      let bitmap = root.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node2 = root.array[j++];
          nodes[i] = node2;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root.array, idx, {
        type: ENTRY,
        k: key3,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root, shift, hash3, key3, val, addedLeaf) {
  if (hash3 === root.hash) {
    const idx = collisionIndexOf(root, key3);
    if (idx !== -1) {
      const entry = root.array[idx];
      if (entry.v === val) {
        return root;
      }
      return {
        type: COLLISION_NODE,
        hash: hash3,
        array: cloneAndSet(root.array, idx, { type: ENTRY, k: key3, v: val })
      };
    }
    const size = root.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash: hash3,
      array: cloneAndSet(root.array, size, { type: ENTRY, k: key3, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root.hash, shift),
      array: [root]
    },
    shift,
    hash3,
    key3,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root, key3) {
  const size = root.array.length;
  for (let i = 0; i < size; i++) {
    if (isEqual(key3, root.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root, shift, hash3, key3) {
  switch (root.type) {
    case ARRAY_NODE:
      return findArray(root, shift, hash3, key3);
    case INDEX_NODE:
      return findIndex(root, shift, hash3, key3);
    case COLLISION_NODE:
      return findCollision(root, key3);
  }
}
function findArray(root, shift, hash3, key3) {
  const idx = mask(hash3, shift);
  const node2 = root.array[idx];
  if (node2 === void 0) {
    return void 0;
  }
  if (node2.type !== ENTRY) {
    return find(node2, shift + SHIFT, hash3, key3);
  }
  if (isEqual(key3, node2.k)) {
    return node2;
  }
  return void 0;
}
function findIndex(root, shift, hash3, key3) {
  const bit = bitpos(hash3, shift);
  if ((root.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root.bitmap, bit);
  const node2 = root.array[idx];
  if (node2.type !== ENTRY) {
    return find(node2, shift + SHIFT, hash3, key3);
  }
  if (isEqual(key3, node2.k)) {
    return node2;
  }
  return void 0;
}
function findCollision(root, key3) {
  const idx = collisionIndexOf(root, key3);
  if (idx < 0) {
    return void 0;
  }
  return root.array[idx];
}
function without(root, shift, hash3, key3) {
  switch (root.type) {
    case ARRAY_NODE:
      return withoutArray(root, shift, hash3, key3);
    case INDEX_NODE:
      return withoutIndex(root, shift, hash3, key3);
    case COLLISION_NODE:
      return withoutCollision(root, key3);
  }
}
function withoutArray(root, shift, hash3, key3) {
  const idx = mask(hash3, shift);
  const node2 = root.array[idx];
  if (node2 === void 0) {
    return root;
  }
  let n = void 0;
  if (node2.type === ENTRY) {
    if (!isEqual(node2.k, key3)) {
      return root;
    }
  } else {
    n = without(node2, shift + SHIFT, hash3, key3);
    if (n === node2) {
      return root;
    }
  }
  if (n === void 0) {
    if (root.size <= MIN_ARRAY_NODE) {
      const arr = root.array;
      const out = new Array(root.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root.size - 1,
      array: cloneAndSet(root.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function withoutIndex(root, shift, hash3, key3) {
  const bit = bitpos(hash3, shift);
  if ((root.bitmap & bit) === 0) {
    return root;
  }
  const idx = index(root.bitmap, bit);
  const node2 = root.array[idx];
  if (node2.type !== ENTRY) {
    const n = without(node2, shift + SHIFT, hash3, key3);
    if (n === node2) {
      return root;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  if (isEqual(key3, node2.k)) {
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  return root;
}
function withoutCollision(root, key3) {
  const idx = collisionIndexOf(root, key3);
  if (idx < 0) {
    return root;
  }
  if (root.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root.hash,
    array: spliceOut(root.array, idx)
  };
}
function forEach(root, fn) {
  if (root === void 0) {
    return;
  }
  const items = root.array;
  const size = items.length;
  for (let i = 0; i < size; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root, size) {
    this.root = root;
    this.size = size;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key3, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key3), key3);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key3, val) {
    const addedLeaf = { val: false };
    const root = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root, 0, getHash(key3), key3, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key3) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key3), key3);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key3) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key3), key3) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    try {
      this.forEach((v, k) => {
        if (!isEqual(o.get(k, !v), v)) {
          throw unequalDictSymbol;
        }
      });
      return true;
    } catch (e) {
      if (e === unequalDictSymbol) {
        return false;
      }
      throw e;
    }
  }
};
var unequalDictSymbol = Symbol();

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function parse_int(value2) {
  if (/^[-+]?(\d+)$/.test(value2)) {
    return new Ok(parseInt(value2));
  } else {
    return new Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
function float_to_string(float4) {
  const string7 = float4.toString().replace("+", "");
  if (string7.indexOf(".") >= 0) {
    return string7;
  } else {
    const index6 = string7.indexOf("e");
    if (index6 >= 0) {
      return string7.slice(0, index6) + ".0" + string7.slice(index6);
    } else {
      return string7 + ".0";
    }
  }
}
function string_replace(string7, target2, substitute) {
  if (typeof string7.replaceAll !== "undefined") {
    return string7.replaceAll(target2, substitute);
  }
  return string7.replace(
    // $& means the whole matched string
    new RegExp(target2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    substitute
  );
}
var segmenter = void 0;
function graphemes_iterator(string7) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string7)[Symbol.iterator]();
  }
}
function pop_grapheme(string7) {
  let first4;
  const iterator = graphemes_iterator(string7);
  if (iterator) {
    first4 = iterator.next().value?.segment;
  } else {
    first4 = string7.match(/./su)?.[0];
  }
  if (first4) {
    return new Ok([first4, string7.slice(first4.length)]);
  } else {
    return new Error(Nil);
  }
}
function pop_codeunit(str) {
  return [str.charCodeAt(0) | 0, str.slice(1)];
}
function lowercase(string7) {
  return string7.toLowerCase();
}
function add(a, b) {
  return a + b;
}
function join(xs, separator) {
  const iterator = xs[Symbol.iterator]();
  let result = iterator.next().value || "";
  let current = iterator.next();
  while (!current.done) {
    result = result + separator + current.value;
    current = iterator.next();
  }
  return result;
}
function concat(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
}
function string_codeunit_slice(str, from2, length5) {
  return str.slice(from2, from2 + length5);
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = new RegExp(`^[${unicode_whitespaces}]*`);
var trim_end_regex = new RegExp(`[${unicode_whitespaces}]*$`);
function bit_array_pad_to_bytes(bit_array3) {
  const trailingBitsCount = bit_array3.bitSize % 8;
  if (trailingBitsCount === 0) {
    return bit_array3;
  }
  const finalByte = bit_array3.byteAt(bit_array3.byteSize - 1);
  const unusedBitsCount = 8 - trailingBitsCount;
  const correctFinalByte = finalByte >> unusedBitsCount << unusedBitsCount;
  if (finalByte === correctFinalByte) {
    return new BitArray(
      bit_array3.rawBuffer,
      bit_array3.byteSize * 8,
      bit_array3.bitOffset
    );
  }
  const buffer = new Uint8Array(bit_array3.byteSize);
  for (let i = 0; i < buffer.length - 1; i++) {
    buffer[i] = bit_array3.byteAt(i);
  }
  buffer[buffer.length - 1] = correctFinalByte;
  return new BitArray(buffer);
}
function new_map() {
  return Dict.new();
}
function map_to_list(map7) {
  return List.fromArray(map7.entries());
}
function map_get(map7, key3) {
  const value2 = map7.get(key3, NOT_FOUND);
  if (value2 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value2);
}
function map_insert(key3, value2, map7) {
  return map7.set(key3, value2);
}
function percent_encode(string7) {
  return encodeURIComponent(string7).replace("%2B", "+");
}
var b64EncodeLookup = [
  65,
  66,
  67,
  68,
  69,
  70,
  71,
  72,
  73,
  74,
  75,
  76,
  77,
  78,
  79,
  80,
  81,
  82,
  83,
  84,
  85,
  86,
  87,
  88,
  89,
  90,
  97,
  98,
  99,
  100,
  101,
  102,
  103,
  104,
  105,
  106,
  107,
  108,
  109,
  110,
  111,
  112,
  113,
  114,
  115,
  116,
  117,
  118,
  119,
  120,
  121,
  122,
  48,
  49,
  50,
  51,
  52,
  53,
  54,
  55,
  56,
  57,
  43,
  47
];
var b64TextDecoder;
function encode64(bit_array3, padding2) {
  b64TextDecoder ??= new TextDecoder();
  bit_array3 = bit_array_pad_to_bytes(bit_array3);
  const m = bit_array3.byteSize;
  const k = m % 3;
  const n = Math.floor(m / 3) * 4 + (k && k + 1);
  const N = Math.ceil(m / 3) * 4;
  const encoded = new Uint8Array(N);
  for (let i = 0, j = 0; j < m; i += 4, j += 3) {
    const y = (bit_array3.byteAt(j) << 16) + (bit_array3.byteAt(j + 1) << 8) + (bit_array3.byteAt(j + 2) | 0);
    encoded[i] = b64EncodeLookup[y >> 18];
    encoded[i + 1] = b64EncodeLookup[y >> 12 & 63];
    encoded[i + 2] = b64EncodeLookup[y >> 6 & 63];
    encoded[i + 3] = b64EncodeLookup[y & 63];
  }
  let base64 = b64TextDecoder.decode(new Uint8Array(encoded.buffer, 0, n));
  if (padding2) {
    if (k === 1) {
      base64 += "==";
    } else if (k === 2) {
      base64 += "=";
    }
  }
  return base64;
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Tuple of ${data.length} elements`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Null";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function decoder_error(expected, got) {
  return decoder_error_no_classify(expected, classify_dynamic(got));
}
function decoder_error_no_classify(expected, got) {
  return new Error(
    List.fromArray([new DecodeError(expected, got, List.fromArray([]))])
  );
}
function decode_string(data) {
  return typeof data === "string" ? new Ok(data) : decoder_error("String", data);
}
function decode_int(data) {
  return Number.isInteger(data) ? new Ok(data) : decoder_error("Int", data);
}
function inspect(v) {
  const t = typeof v;
  if (v === true)
    return "True";
  if (v === false)
    return "False";
  if (v === null)
    return "//js(null)";
  if (v === void 0)
    return "Nil";
  if (t === "string")
    return inspectString(v);
  if (t === "bigint" || Number.isInteger(v))
    return v.toString();
  if (t === "number")
    return float_to_string(v);
  if (Array.isArray(v))
    return `#(${v.map(inspect).join(", ")})`;
  if (v instanceof List)
    return inspectList(v);
  if (v instanceof UtfCodepoint)
    return inspectUtfCodepoint(v);
  if (v instanceof BitArray)
    return `<<${bit_array_inspect(v, "")}>>`;
  if (v instanceof CustomType)
    return inspectCustomType(v);
  if (v instanceof Dict)
    return inspectDict(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(inspect).join(", ")}))`;
  if (v instanceof RegExp)
    return `//js(${v})`;
  if (v instanceof Date)
    return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return inspectObject(v);
}
function inspectString(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    switch (char) {
      case "\n":
        new_str += "\\n";
        break;
      case "\r":
        new_str += "\\r";
        break;
      case "	":
        new_str += "\\t";
        break;
      case "\f":
        new_str += "\\f";
        break;
      case "\\":
        new_str += "\\\\";
        break;
      case '"':
        new_str += '\\"';
        break;
      default:
        if (char < " " || char > "~" && char < "\xA0") {
          new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
        } else {
          new_str += char;
        }
    }
  }
  new_str += '"';
  return new_str;
}
function inspectDict(map7) {
  let body2 = "dict.from_list([";
  let first4 = true;
  map7.forEach((value2, key3) => {
    if (!first4)
      body2 = body2 + ", ";
    body2 = body2 + "#(" + inspect(key3) + ", " + inspect(value2) + ")";
    first4 = false;
  });
  return body2 + "])";
}
function inspectObject(v) {
  const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${inspect(k)}: ${inspect(v[k])}`);
  }
  const body2 = props.length ? " " + props.join(", ") + " " : "";
  const head = name === "Object" ? "" : name + " ";
  return `//js(${head}{${body2}})`;
}
function inspectCustomType(record) {
  const props = Object.keys(record).map((label) => {
    const value2 = inspect(record[label]);
    return isNaN(parseInt(label)) ? `${label}: ${value2}` : value2;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function inspectList(list4) {
  return `[${list4.toArray().map(inspect).join(", ")}]`;
}
function inspectUtfCodepoint(codepoint2) {
  return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
}
function base16_encode(bit_array3) {
  const trailingBitsCount = bit_array3.bitSize % 8;
  let result = "";
  for (let i = 0; i < bit_array3.byteSize; i++) {
    let byte = bit_array3.byteAt(i);
    if (i === bit_array3.byteSize - 1 && trailingBitsCount !== 0) {
      const unusedBitsCount = 8 - trailingBitsCount;
      byte = byte >> unusedBitsCount << unusedBitsCount;
    }
    result += byte.toString(16).padStart(2, "0").toUpperCase();
  }
  return result;
}
function bit_array_inspect(bits, acc) {
  if (bits.bitSize === 0) {
    return acc;
  }
  for (let i = 0; i < bits.byteSize - 1; i++) {
    acc += bits.byteAt(i).toString();
    acc += ", ";
  }
  if (bits.byteSize * 8 === bits.bitSize) {
    acc += bits.byteAt(bits.byteSize - 1).toString();
  } else {
    const trailingBitsCount = bits.bitSize % 8;
    acc += bits.byteAt(bits.byteSize - 1) >> 8 - trailingBitsCount;
    acc += `:size(${trailingBitsCount})`;
  }
  return acc;
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict3, key3, value2) {
  return map_insert(key3, value2, dict3);
}
function reverse_and_concat(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let first4 = remaining.head;
      let rest = remaining.tail;
      loop$remaining = rest;
      loop$accumulator = prepend(first4, accumulator);
    }
  }
}
function do_keys_loop(loop$list, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let key3 = list4.head[0];
      let rest = list4.tail;
      loop$list = rest;
      loop$acc = prepend(key3, acc);
    }
  }
}
function keys(dict3) {
  return do_keys_loop(map_to_list(dict3), toList([]));
}
function do_values_loop(loop$list, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let value2 = list4.head[1];
      let rest = list4.tail;
      loop$list = rest;
      loop$acc = prepend(value2, acc);
    }
  }
}
function values(dict3) {
  let list_of_pairs = map_to_list(dict3);
  return do_values_loop(list_of_pairs, toList([]));
}

// build/dev/javascript/decode/decode_ffi.mjs
function strict_index(data, key3) {
  const int5 = Number.isInteger(key3);
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const token = {};
    const entry = data.get(key3, token);
    if (entry === token)
      return new Ok(new None());
    return new Ok(new Some(entry));
  }
  if ((key3 === 0 || key3 === 1 || key3 === 2) && data instanceof List) {
    let i = 0;
    for (const value2 of data) {
      if (i === key3)
        return new Ok(new Some(value2));
      i++;
    }
    return new Error("Indexable");
  }
  if (int5 && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    if (key3 in data)
      return new Ok(new Some(data[key3]));
    return new Ok(new None());
  }
  return new Error(int5 ? "Indexable" : "Dict");
}
function list(data, decode2, pushPath, index6, emptyList) {
  if (!(data instanceof List || Array.isArray(data))) {
    let error = new DecodeError("List", classify_dynamic(data), emptyList);
    return [emptyList, List.fromArray([error])];
  }
  const decoded = [];
  for (const element3 of data) {
    const layer = decode2(element3);
    const [out, errors] = layer;
    if (errors instanceof NonEmpty) {
      const [_, errors2] = pushPath(layer, index6.toString());
      return [emptyList, errors2];
    }
    decoded.push(out);
    index6++;
  }
  return [List.fromArray(decoded), emptyList];
}

// build/dev/javascript/decode/decode/zero.mjs
var Decoder = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
function run(data, decoder) {
  let $ = decoder.function(data);
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors.hasLength(0)) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function success(data) {
  return new Decoder((_) => {
    return [data, toList([])];
  });
}
function run_dynamic_function(data, zero, f) {
  let $ = f(data);
  if ($.isOk()) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let errors = $[0];
    return [zero, errors];
  }
}
function decode_string2(data) {
  return run_dynamic_function(data, "", string2);
}
var string3 = /* @__PURE__ */ new Decoder(decode_string2);
function list2(inner) {
  return new Decoder(
    (data) => {
      return list(
        data,
        inner.function,
        (p, k) => {
          return push_path(p, toList([k]));
        },
        0,
        toList([])
      );
    }
  );
}
function push_path(layer, path) {
  let decoder = any(
    toList([
      string2,
      (x) => {
        return map3(int(x), to_string);
      }
    ])
  );
  let path$1 = map2(
    path,
    (key3) => {
      let key$1 = identity(key3);
      let $ = decoder(key$1);
      if ($.isOk()) {
        let key$2 = $[0];
        return key$2;
      } else {
        return "<" + classify_dynamic(key$1) + ">";
      }
    }
  );
  let errors = map2(
    layer[1],
    (error) => {
      let _record = error;
      return new DecodeError(
        _record.expected,
        _record.found,
        append(path$1, error.path)
      );
    }
  );
  return [layer[0], errors];
}
function index2(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data = loop$data;
    let handle_miss = loop$handle_miss;
    if (path.hasLength(0)) {
      let _pipe = inner(data);
      return push_path(_pipe, reverse(position));
    } else {
      let key3 = path.head;
      let path$1 = path.tail;
      let $ = strict_index(data, key3);
      if ($.isOk() && $[0] instanceof Some) {
        let data$1 = $[0][0];
        loop$path = path$1;
        loop$position = prepend(key3, position);
        loop$inner = inner;
        loop$data = data$1;
        loop$handle_miss = handle_miss;
      } else if ($.isOk() && $[0] instanceof None) {
        return handle_miss(data, prepend(key3, position));
      } else {
        let kind = $[0];
        let $1 = inner(data);
        let default$ = $1[0];
        let _pipe = [
          default$,
          toList([new DecodeError(kind, classify_dynamic(data), toList([]))])
        ];
        return push_path(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next) {
  return new Decoder(
    (data) => {
      let $ = index2(
        field_path,
        toList([]),
        field_decoder.function,
        data,
        (data2, position) => {
          let $12 = field_decoder.function(data2);
          let default$ = $12[0];
          let _pipe = [
            default$,
            toList([new DecodeError("Field", "Nothing", toList([]))])
          ];
          return push_path(_pipe, reverse(position));
        }
      );
      let out = $[0];
      let errors1 = $[1];
      let $1 = next(out).function(data);
      let out$1 = $1[0];
      let errors2 = $1[1];
      return [out$1, append(errors1, errors2)];
    }
  );
}
function field(field_name, field_decoder, next) {
  return subfield(toList([field_name]), field_decoder, next);
}

// build/dev/javascript/gleam_javascript/gleam_javascript_ffi.mjs
var PromiseLayer = class _PromiseLayer {
  constructor(promise) {
    this.promise = promise;
  }
  static wrap(value2) {
    return value2 instanceof Promise ? new _PromiseLayer(value2) : value2;
  }
  static unwrap(value2) {
    return value2 instanceof _PromiseLayer ? value2.promise : value2;
  }
};
function resolve(value2) {
  return Promise.resolve(PromiseLayer.wrap(value2));
}
function then_await(promise, fn) {
  return promise.then((value2) => fn(PromiseLayer.unwrap(value2)));
}
function map_promise(promise, fn) {
  return promise.then(
    (value2) => PromiseLayer.wrap(fn(PromiseLayer.unwrap(value2)))
  );
}
function rescue(promise, fn) {
  return promise.catch((error) => fn(error));
}

// build/dev/javascript/gleam_javascript/gleam/javascript/promise.mjs
function tap(promise, callback) {
  let _pipe = promise;
  return map_promise(
    _pipe,
    (a) => {
      callback(a);
      return a;
    }
  );
}
function map_try(promise, callback) {
  let _pipe = promise;
  return map_promise(
    _pipe,
    (result) => {
      if (result.isOk()) {
        let a = result[0];
        return callback(a);
      } else {
        let e = result[0];
        return new Error(e);
      }
    }
  );
}
function try_await(promise, callback) {
  let _pipe = promise;
  return then_await(
    _pipe,
    (result) => {
      if (result.isOk()) {
        let a = result[0];
        return callback(a);
      } else {
        let e = result[0];
        return resolve(new Error(e));
      }
    }
  );
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib_decode_ffi.mjs
function index4(data, key3) {
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const token = {};
    const entry = data.get(key3, token);
    if (entry === token)
      return new Ok(new None());
    return new Ok(new Some(entry));
  }
  const key_is_int = Number.isInteger(key3);
  if (key_is_int && key3 >= 0 && key3 < 8 && data instanceof List) {
    let i = 0;
    for (const value2 of data) {
      if (i === key3)
        return new Ok(new Some(value2));
      i++;
    }
    return new Error("Indexable");
  }
  if (key_is_int && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    if (key3 in data)
      return new Ok(new Some(data[key3]));
    return new Ok(new None());
  }
  return new Error(key_is_int ? "Indexable" : "Dict");
}
function int2(data) {
  if (Number.isInteger(data))
    return new Ok(data);
  return new Error(0);
}
function string4(data) {
  if (typeof data === "string")
    return new Ok(data);
  return new Error(0);
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var DecodeError2 = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
var Decoder2 = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
function run2(data, decoder) {
  let $ = decoder.function(data);
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors.hasLength(0)) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function success2(data) {
  return new Decoder2((_) => {
    return [data, toList([])];
  });
}
function map5(decoder, transformer) {
  return new Decoder2(
    (d) => {
      let $ = decoder.function(d);
      let data = $[0];
      let errors = $[1];
      return [transformer(data), errors];
    }
  );
}
function then$2(decoder, next) {
  return new Decoder2(
    (dynamic_data) => {
      let $ = decoder.function(dynamic_data);
      let data = $[0];
      let errors = $[1];
      let decoder$1 = next(data);
      let $1 = decoder$1.function(dynamic_data);
      let layer = $1;
      let data$1 = $1[0];
      if (errors.hasLength(0)) {
        return layer;
      } else {
        return [data$1, errors];
      }
    }
  );
}
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data = loop$data;
    let failure2 = loop$failure;
    let decoders = loop$decoders;
    if (decoders.hasLength(0)) {
      return failure2;
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder.function(data);
      let layer = $;
      let errors = $[1];
      if (errors.hasLength(0)) {
        return layer;
      } else {
        loop$data = data;
        loop$failure = failure2;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first4, alternatives) {
  return new Decoder2(
    (dynamic_data) => {
      let $ = first4.function(dynamic_data);
      let layer = $;
      let errors = $[1];
      if (errors.hasLength(0)) {
        return layer;
      } else {
        return run_decoders(dynamic_data, layer, alternatives);
      }
    }
  );
}
function decode_error(expected, found) {
  return toList([
    new DecodeError2(expected, classify_dynamic(found), toList([]))
  ]);
}
function run_dynamic_function2(data, name, f) {
  let $ = f(data);
  if ($.isOk()) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let zero = $[0];
    return [
      zero,
      toList([new DecodeError2(name, classify_dynamic(data), toList([]))])
    ];
  }
}
function decode_int2(data) {
  return run_dynamic_function2(data, "Int", int2);
}
function failure(zero, expected) {
  return new Decoder2((d) => {
    return [zero, decode_error(expected, d)];
  });
}
var int3 = /* @__PURE__ */ new Decoder2(decode_int2);
function decode_string3(data) {
  return run_dynamic_function2(data, "String", string4);
}
var string5 = /* @__PURE__ */ new Decoder2(decode_string3);
function push_path2(layer, path) {
  let decoder = one_of(
    string5,
    toList([
      (() => {
        let _pipe = int3;
        return map5(_pipe, to_string);
      })()
    ])
  );
  let path$1 = map2(
    path,
    (key3) => {
      let key$1 = identity(key3);
      let $ = run2(key$1, decoder);
      if ($.isOk()) {
        let key$2 = $[0];
        return key$2;
      } else {
        return "<" + classify_dynamic(key$1) + ">";
      }
    }
  );
  let errors = map2(
    layer[1],
    (error) => {
      let _record = error;
      return new DecodeError2(
        _record.expected,
        _record.found,
        append(path$1, error.path)
      );
    }
  );
  return [layer[0], errors];
}
function index5(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data = loop$data;
    let handle_miss = loop$handle_miss;
    if (path.hasLength(0)) {
      let _pipe = inner(data);
      return push_path2(_pipe, reverse(position));
    } else {
      let key3 = path.head;
      let path$1 = path.tail;
      let $ = index4(data, key3);
      if ($.isOk() && $[0] instanceof Some) {
        let data$1 = $[0][0];
        loop$path = path$1;
        loop$position = prepend(key3, position);
        loop$inner = inner;
        loop$data = data$1;
        loop$handle_miss = handle_miss;
      } else if ($.isOk() && $[0] instanceof None) {
        return handle_miss(data, prepend(key3, position));
      } else {
        let kind = $[0];
        let $1 = inner(data);
        let default$ = $1[0];
        let _pipe = [
          default$,
          toList([new DecodeError2(kind, classify_dynamic(data), toList([]))])
        ];
        return push_path2(_pipe, reverse(position));
      }
    }
  }
}
function subfield2(field_path, field_decoder, next) {
  return new Decoder2(
    (data) => {
      let $ = index5(
        field_path,
        toList([]),
        field_decoder.function,
        data,
        (data2, position) => {
          let $12 = field_decoder.function(data2);
          let default$ = $12[0];
          let _pipe = [
            default$,
            toList([new DecodeError2("Field", "Nothing", toList([]))])
          ];
          return push_path2(_pipe, reverse(position));
        }
      );
      let out = $[0];
      let errors1 = $[1];
      let $1 = next(out).function(data);
      let out$1 = $1[0];
      let errors2 = $1[1];
      return [out$1, append(errors1, errors2)];
    }
  );
}
function field2(field_name, field_decoder, next) {
  return subfield2(toList([field_name]), field_decoder, next);
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function decode(string7) {
  try {
    const result = JSON.parse(string7);
    return new Ok(result);
  } catch (err) {
    return new Error(getJsonDecodeError(err, string7));
  }
}
function getJsonDecodeError(stdErr, json) {
  if (isUnexpectedEndOfInput(stdErr))
    return new UnexpectedEndOfInput();
  return toUnexpectedByteError(stdErr, json);
}
function isUnexpectedEndOfInput(err) {
  const unexpectedEndOfInputRegex = /((unexpected (end|eof))|(end of data)|(unterminated string)|(json( parse error|\.parse)\: expected '(\:|\}|\])'))/i;
  return unexpectedEndOfInputRegex.test(err.message);
}
function toUnexpectedByteError(err, json) {
  let converters = [
    v8UnexpectedByteError,
    oldV8UnexpectedByteError,
    jsCoreUnexpectedByteError,
    spidermonkeyUnexpectedByteError
  ];
  for (let converter of converters) {
    let result = converter(err, json);
    if (result)
      return result;
  }
  return new UnexpectedByte("", 0);
}
function v8UnexpectedByteError(err) {
  const regex = /unexpected token '(.)', ".+" is not valid JSON/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[1]);
  return new UnexpectedByte(byte, -1);
}
function oldV8UnexpectedByteError(err) {
  const regex = /unexpected token (.) in JSON at position (\d+)/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[1]);
  const position = Number(match[2]);
  return new UnexpectedByte(byte, position);
}
function spidermonkeyUnexpectedByteError(err, json) {
  const regex = /(unexpected character|expected .*) at line (\d+) column (\d+)/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const line = Number(match[2]);
  const column = Number(match[3]);
  const position = getPositionFromMultiline(line, column, json);
  const byte = toHex(json[position]);
  return new UnexpectedByte(byte, position);
}
function jsCoreUnexpectedByteError(err) {
  const regex = /unexpected (identifier|token) "(.)"/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[2]);
  return new UnexpectedByte(byte, 0);
}
function toHex(char) {
  return "0x" + char.charCodeAt(0).toString(16).toUpperCase();
}
function getPositionFromMultiline(line, column, string7) {
  if (line === 1)
    return column - 1;
  let currentLn = 1;
  let position = 0;
  string7.split("").find((char, idx) => {
    if (char === "\n")
      currentLn += 1;
    if (currentLn === line) {
      position = idx + column;
      return true;
    }
    return false;
  });
  return position;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
var UnexpectedEndOfInput = class extends CustomType {
};
var UnexpectedByte = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UnableToDecode = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function do_parse(json, decoder) {
  return then$(
    decode(json),
    (dynamic_value) => {
      let _pipe = run2(dynamic_value, decoder);
      return map_error(
        _pipe,
        (var0) => {
          return new UnableToDecode(var0);
        }
      );
    }
  );
}
function parse(json, decoder) {
  return do_parse(json, decoder);
}

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path, query, fragment2) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
    this.fragment = fragment2;
  }
};
function is_valid_host_within_brackets_char(char) {
  return 48 >= char && char <= 57 || 65 >= char && char <= 90 || 97 >= char && char <= 122 || char === 58 || char === 46;
}
function parse_fragment(rest, pieces) {
  return new Ok(
    (() => {
      let _record = pieces;
      return new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        new Some(rest)
      );
    })()
  );
}
function parse_query_with_question_mark_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string.startsWith("#") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let query = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          new Some(query),
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            _record.path,
            new Some(original),
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse_query_with_question_mark(uri_string, pieces) {
  return parse_query_with_question_mark_loop(uri_string, uri_string, pieces, 0);
}
function parse_path_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let path = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          _record.port,
          path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let path = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          _record.port,
          path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            original,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse_path(uri_string, pieces) {
  return parse_path_loop(uri_string, uri_string, pieces, 0);
}
function parse_port_loop(loop$uri_string, loop$pieces, loop$port) {
  while (true) {
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let port = loop$port;
    if (uri_string.startsWith("0")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10;
    } else if (uri_string.startsWith("1")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 1;
    } else if (uri_string.startsWith("2")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 2;
    } else if (uri_string.startsWith("3")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 3;
    } else if (uri_string.startsWith("4")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 4;
    } else if (uri_string.startsWith("5")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 5;
    } else if (uri_string.startsWith("6")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 6;
    } else if (uri_string.startsWith("7")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 7;
    } else if (uri_string.startsWith("8")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 8;
    } else if (uri_string.startsWith("9")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 9;
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          new Some(port),
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          new Some(port),
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          new Some(port),
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_path(uri_string, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            new Some(port),
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      return new Error(void 0);
    }
  }
}
function parse_port(uri_string, pieces) {
  if (uri_string.startsWith(":0")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 0);
  } else if (uri_string.startsWith(":1")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 1);
  } else if (uri_string.startsWith(":2")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 2);
  } else if (uri_string.startsWith(":3")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 3);
  } else if (uri_string.startsWith(":4")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 4);
  } else if (uri_string.startsWith(":5")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 5);
  } else if (uri_string.startsWith(":6")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 6);
  } else if (uri_string.startsWith(":7")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 7);
  } else if (uri_string.startsWith(":8")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 8);
  } else if (uri_string.startsWith(":9")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 9);
  } else if (uri_string.startsWith(":")) {
    return new Error(void 0);
  } else if (uri_string.startsWith("?")) {
    let rest = uri_string.slice(1);
    return parse_query_with_question_mark(rest, pieces);
  } else if (uri_string.startsWith("#")) {
    let rest = uri_string.slice(1);
    return parse_fragment(rest, pieces);
  } else if (uri_string.startsWith("/")) {
    return parse_path(uri_string, pieces);
  } else if (uri_string === "") {
    return new Ok(pieces);
  } else {
    return new Error(void 0);
  }
}
function parse_host_outside_of_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            new Some(original),
            _record.port,
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else if (uri_string.startsWith(":")) {
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_port(uri_string, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse_host_within_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            new Some(uri_string),
            _record.port,
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else if (uri_string.startsWith("]") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_port(rest, pieces);
    } else if (uri_string.startsWith("]")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size + 1);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_port(rest, pieces$1);
    } else if (uri_string.startsWith("/") && size === 0) {
      return parse_path(uri_string, pieces);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_query_with_question_mark(rest, pieces);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else {
      let $ = pop_codeunit(uri_string);
      let char = $[0];
      let rest = $[1];
      let $1 = is_valid_host_within_brackets_char(char);
      if ($1) {
        loop$original = original;
        loop$uri_string = rest;
        loop$pieces = pieces;
        loop$size = size + 1;
      } else {
        return parse_host_outside_of_brackets_loop(
          original,
          original,
          pieces,
          0
        );
      }
    }
  }
}
function parse_host_within_brackets(uri_string, pieces) {
  return parse_host_within_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host_outside_of_brackets(uri_string, pieces) {
  return parse_host_outside_of_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host(uri_string, pieces) {
  if (uri_string.startsWith("[")) {
    return parse_host_within_brackets(uri_string, pieces);
  } else if (uri_string.startsWith(":")) {
    let pieces$1 = (() => {
      let _record = pieces;
      return new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(""),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
    })();
    return parse_port(uri_string, pieces$1);
  } else if (uri_string === "") {
    return new Ok(
      (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(""),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })()
    );
  } else {
    return parse_host_outside_of_brackets(uri_string, pieces);
  }
}
function parse_userinfo_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string.startsWith("@") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_host(rest, pieces);
    } else if (uri_string.startsWith("@")) {
      let rest = uri_string.slice(1);
      let userinfo = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          new Some(userinfo),
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_host(rest, pieces$1);
    } else if (uri_string === "") {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("/")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("?")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("#")) {
      return parse_host(original, pieces);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse_authority_pieces(string7, pieces) {
  return parse_userinfo_loop(string7, string7, pieces, 0);
}
function parse_authority_with_slashes(uri_string, pieces) {
  if (uri_string === "//") {
    return new Ok(
      (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(""),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })()
    );
  } else if (uri_string.startsWith("//")) {
    let rest = uri_string.slice(2);
    return parse_authority_pieces(rest, pieces);
  } else {
    return parse_path(uri_string, pieces);
  }
}
function parse_scheme_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string.startsWith("/") && size === 0) {
      return parse_authority_with_slashes(uri_string, pieces);
    } else if (uri_string.startsWith("/")) {
      let scheme = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_authority_with_slashes(uri_string, pieces$1);
    } else if (uri_string.startsWith("?") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_query_with_question_mark(rest, pieces);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith(":") && size === 0) {
      return new Error(void 0);
    } else if (uri_string.startsWith(":")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_authority_with_slashes(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            original,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function to_string2(uri) {
  let parts = (() => {
    let $ = uri.fragment;
    if ($ instanceof Some) {
      let fragment2 = $[0];
      return toList(["#", fragment2]);
    } else {
      return toList([]);
    }
  })();
  let parts$1 = (() => {
    let $ = uri.query;
    if ($ instanceof Some) {
      let query = $[0];
      return prepend("?", prepend(query, parts));
    } else {
      return parts;
    }
  })();
  let parts$2 = prepend(uri.path, parts$1);
  let parts$3 = (() => {
    let $ = uri.host;
    let $1 = starts_with(uri.path, "/");
    if ($ instanceof Some && !$1 && $[0] !== "") {
      let host = $[0];
      return prepend("/", parts$2);
    } else {
      return parts$2;
    }
  })();
  let parts$4 = (() => {
    let $ = uri.host;
    let $1 = uri.port;
    if ($ instanceof Some && $1 instanceof Some) {
      let port = $1[0];
      return prepend(":", prepend(to_string(port), parts$3));
    } else {
      return parts$3;
    }
  })();
  let parts$5 = (() => {
    let $ = uri.scheme;
    let $1 = uri.userinfo;
    let $2 = uri.host;
    if ($ instanceof Some && $1 instanceof Some && $2 instanceof Some) {
      let s = $[0];
      let u = $1[0];
      let h = $2[0];
      return prepend(
        s,
        prepend(
          "://",
          prepend(u, prepend("@", prepend(h, parts$4)))
        )
      );
    } else if ($ instanceof Some && $1 instanceof None && $2 instanceof Some) {
      let s = $[0];
      let h = $2[0];
      return prepend(s, prepend("://", prepend(h, parts$4)));
    } else if ($ instanceof Some && $1 instanceof Some && $2 instanceof None) {
      let s = $[0];
      return prepend(s, prepend(":", parts$4));
    } else if ($ instanceof Some && $1 instanceof None && $2 instanceof None) {
      let s = $[0];
      return prepend(s, prepend(":", parts$4));
    } else if ($ instanceof None && $1 instanceof None && $2 instanceof Some) {
      let h = $2[0];
      return prepend("//", prepend(h, parts$4));
    } else {
      return parts$4;
    }
  })();
  return concat2(parts$5);
}
var empty = /* @__PURE__ */ new Uri(
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  "",
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None()
);
function parse2(uri_string) {
  return parse_scheme_loop(uri_string, uri_string, empty, 0);
}

// build/dev/javascript/glebs/glebs.mjs
var OAuth2ClientConfig = class extends CustomType {
  constructor(client_id, authorize_url, token_url, redirect_uri, scope) {
    super();
    this.client_id = client_id;
    this.authorize_url = authorize_url;
    this.token_url = token_url;
    this.redirect_uri = redirect_uri;
    this.scope = scope;
  }
};
var TokenResponse = class extends CustomType {
  constructor(access_token, token_type, expires_in, refresh_token) {
    super();
    this.access_token = access_token;
    this.token_type = token_type;
    this.expires_in = expires_in;
    this.refresh_token = refresh_token;
  }
};

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}
function lazy_guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence();
  } else {
    return alternative();
  }
}

// build/dev/javascript/gleam_http/gleam/http.mjs
var Get = class extends CustomType {
};
var Post = class extends CustomType {
};
var Head = class extends CustomType {
};
var Put = class extends CustomType {
};
var Delete = class extends CustomType {
};
var Trace = class extends CustomType {
};
var Connect = class extends CustomType {
};
var Options = class extends CustomType {
};
var Patch = class extends CustomType {
};
var Http = class extends CustomType {
};
var Https = class extends CustomType {
};
function method_to_string(method) {
  if (method instanceof Connect) {
    return "connect";
  } else if (method instanceof Delete) {
    return "delete";
  } else if (method instanceof Get) {
    return "get";
  } else if (method instanceof Head) {
    return "head";
  } else if (method instanceof Options) {
    return "options";
  } else if (method instanceof Patch) {
    return "patch";
  } else if (method instanceof Post) {
    return "post";
  } else if (method instanceof Put) {
    return "put";
  } else if (method instanceof Trace) {
    return "trace";
  } else {
    let s = method[0];
    return s;
  }
}
function scheme_to_string(scheme) {
  if (scheme instanceof Http) {
    return "http";
  } else {
    return "https";
  }
}
function scheme_from_string(scheme) {
  let $ = lowercase(scheme);
  if ($ === "http") {
    return new Ok(new Http());
  } else if ($ === "https") {
    return new Ok(new Https());
  } else {
    return new Error(void 0);
  }
}

// build/dev/javascript/gleam_http/gleam/http/request.mjs
var Request = class extends CustomType {
  constructor(method, headers, body2, scheme, host, port, path, query) {
    super();
    this.method = method;
    this.headers = headers;
    this.body = body2;
    this.scheme = scheme;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
  }
};
function to_uri(request) {
  return new Uri(
    new Some(scheme_to_string(request.scheme)),
    new None(),
    new Some(request.host),
    request.port,
    request.path,
    request.query,
    new None()
  );
}
function from_uri(uri) {
  return then$(
    (() => {
      let _pipe = uri.scheme;
      let _pipe$1 = unwrap(_pipe, "");
      return scheme_from_string(_pipe$1);
    })(),
    (scheme) => {
      return then$(
        (() => {
          let _pipe = uri.host;
          return to_result(_pipe, void 0);
        })(),
        (host) => {
          let req = new Request(
            new Get(),
            toList([]),
            "",
            scheme,
            host,
            uri.port,
            uri.path,
            uri.query
          );
          return new Ok(req);
        }
      );
    }
  );
}
function set_query(req, query) {
  let pair = (t) => {
    return percent_encode(t[0]) + "=" + percent_encode(t[1]);
  };
  let query$1 = (() => {
    let _pipe = query;
    let _pipe$1 = map2(_pipe, pair);
    let _pipe$2 = intersperse(_pipe$1, "&");
    let _pipe$3 = concat2(_pipe$2);
    return new Some(_pipe$3);
  })();
  let _record = req;
  return new Request(
    _record.method,
    _record.headers,
    _record.body,
    _record.scheme,
    _record.host,
    _record.port,
    _record.path,
    query$1
  );
}
function to(url) {
  let _pipe = url;
  let _pipe$1 = parse2(_pipe);
  return then$(_pipe$1, from_uri);
}

// build/dev/javascript/gleam_http/gleam/http/response.mjs
var Response = class extends CustomType {
  constructor(status, headers, body2) {
    super();
    this.status = status;
    this.headers = headers;
    this.body = body2;
  }
};

// build/dev/javascript/gleam_fetch/gleam_fetch_ffi.mjs
async function raw_send(request) {
  try {
    return new Ok(await fetch(request));
  } catch (error) {
    return new Error(new NetworkError(error.toString()));
  }
}
function from_fetch_response(response) {
  return new Response(
    response.status,
    List.fromArray([...response.headers]),
    response
  );
}
function request_common(request) {
  let url = to_string2(to_uri(request));
  let method = method_to_string(request.method).toUpperCase();
  let options = {
    headers: make_headers(request.headers),
    method
  };
  return [url, options];
}
function to_fetch_request(request) {
  let [url, options] = request_common(request);
  if (options.method !== "GET" && options.method !== "HEAD")
    options.body = request.body;
  return new globalThis.Request(url, options);
}
function make_headers(headersList) {
  let headers = new globalThis.Headers();
  for (let [k, v] of headersList)
    headers.append(k.toLowerCase(), v);
  return headers;
}
async function read_json_body(response) {
  try {
    let body2 = await response.body.json();
    return new Ok(response.withFields({ body: body2 }));
  } catch (error) {
    return new Error(new InvalidJsonBody());
  }
}

// build/dev/javascript/gleam_fetch/gleam/fetch.mjs
var NetworkError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var InvalidJsonBody = class extends CustomType {
};
function send(request) {
  let _pipe = request;
  let _pipe$1 = to_fetch_request(_pipe);
  let _pipe$2 = raw_send(_pipe$1);
  return try_await(
    _pipe$2,
    (resp) => {
      return resolve(new Ok(from_fetch_response(resp)));
    }
  );
}

// build/dev/javascript/glebs/glebs_crypto_ffi.mjs
function getRandomValues(data) {
  try {
    crypto.getRandomValues(data.buffer);
    return new Ok(toBitArray(data.buffer));
  } catch (e) {
    return new Error(e.message);
  }
}
async function hash(string_to_hash) {
  const utf8 = new TextEncoder().encode(string_to_hash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
  let a = new Uint8Array(hashBuffer);
  return new Ok(toBitArray(a));
}

// build/dev/javascript/glebs/glebs/crypto.mjs
function get_random_values(data) {
  return getRandomValues(data);
}
function bits_to_string(bits) {
  let _pipe = bits;
  let _pipe$1 = base16_encode(_pipe);
  return lowercase(_pipe$1);
}
function get_random_string(length5) {
  let data = toBitArray([sizedInt(0, length5 * 8, true)]);
  let _pipe = get_random_values(data);
  return map3(_pipe, bits_to_string);
}
function hash2(data) {
  return hash(data);
}

// build/dev/javascript/glebs/glebs/code.mjs
function create_code_verifier() {
  return get_random_string(32);
}
function get_code_challenge_from_verifier(verifier) {
  let _pipe = hash2(verifier);
  return map_promise(
    _pipe,
    (res) => {
      let _pipe$1 = res;
      let _pipe$2 = map3(
        _pipe$1,
        (_capture) => {
          return encode64(_capture, false);
        }
      );
      return map3(
        _pipe$2,
        (base64) => {
          let _pipe$3 = base64;
          let _pipe$4 = replace(_pipe$3, "=", "");
          let _pipe$5 = replace(_pipe$4, "+", "-");
          return replace(_pipe$5, "/", "_");
        }
      );
    }
  );
}

// build/dev/javascript/glebs/glebs/request.mjs
function create_authorization_request_url(config) {
  return try_await(
    (() => {
      let _pipe = create_code_verifier();
      return resolve(_pipe);
    })(),
    (verifier) => {
      return try_await(
        get_code_challenge_from_verifier(verifier),
        (code_challenge) => {
          let params = toList([
            ["client_id", config.client_id],
            ["redirect_uri", config.redirect_uri],
            ["scope", config.scope],
            ["response_type", "code"],
            ["code_challenge_method", "S256"],
            ["code_challenge", code_challenge]
          ]);
          let _pipe = config.authorize_url;
          let _pipe$1 = to(_pipe);
          let _pipe$2 = map3(
            _pipe$1,
            (req) => {
              let _pipe$22 = req;
              let _pipe$32 = set_query(_pipe$22, params);
              return to_uri(_pipe$32);
            }
          );
          let _pipe$3 = replace_error(
            _pipe$2,
            "Cound not create authorization uri"
          );
          let _pipe$4 = map3(
            _pipe$3,
            (uri) => {
              return [uri, verifier];
            }
          );
          return resolve(_pipe$4);
        }
      );
    }
  );
}
function token_resp_decoder() {
  return field2(
    "access_token",
    string5,
    (access_token) => {
      return field2(
        "token_type",
        string5,
        (token_type) => {
          return field2(
            "expires_in",
            then$2(
              string5,
              (val) => {
                let _pipe = val;
                let _pipe$1 = parse_int(_pipe);
                let _pipe$2 = map3(_pipe$1, success2);
                let _pipe$3 = map_error(
                  _pipe$2,
                  (_) => {
                    return failure(0, "Unable to parse " + val);
                  }
                );
                return unwrap_both(_pipe$3);
              }
            ),
            (expires_in) => {
              echo(expires_in, "src/glebs/request.gleam", 68);
              return field2(
                "refresh_token",
                string5,
                (refresh_token) => {
                  return success2(
                    new TokenResponse(
                      access_token,
                      token_type,
                      expires_in,
                      refresh_token
                    )
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function echo(value2, file, line) {
  const grey = "\x1B[90m";
  const reset_color = "\x1B[39m";
  const file_line = `${file}:${line}`;
  const string_value = echo$inspect(value2);
  if (typeof process === "object" && process.stderr?.write) {
    const string7 = `${grey}${file_line}${reset_color}
${string_value}
`;
    process.stderr.write(string7);
  } else if (typeof Deno === "object") {
    const string7 = `${grey}${file_line}${reset_color}
${string_value}
`;
    Deno.stderr.writeSync(new TextEncoder().encode(string7));
  } else {
    const string7 = `${file_line}
${string_value}`;
    console.log(string7);
  }
  return value2;
}
function echo$inspectString(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    if (char == "\n")
      new_str += "\\n";
    else if (char == "\r")
      new_str += "\\r";
    else if (char == "	")
      new_str += "\\t";
    else if (char == "\f")
      new_str += "\\f";
    else if (char == "\\")
      new_str += "\\\\";
    else if (char == '"')
      new_str += '\\"';
    else if (char < " " || char > "~" && char < "\xA0") {
      new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
    } else {
      new_str += char;
    }
  }
  new_str += '"';
  return new_str;
}
function echo$inspectDict(map7) {
  let body2 = "dict.from_list([";
  let first4 = true;
  let key_value_pairs = [];
  map7.forEach((value2, key3) => {
    key_value_pairs.push([key3, value2]);
  });
  key_value_pairs.sort();
  key_value_pairs.forEach(([key3, value2]) => {
    if (!first4)
      body2 = body2 + ", ";
    body2 = body2 + "#(" + echo$inspect(key3) + ", " + echo$inspect(value2) + ")";
    first4 = false;
  });
  return body2 + "])";
}
function echo$inspectCustomType(record) {
  const props = Object.keys(record).map((label) => {
    const value2 = echo$inspect(record[label]);
    return isNaN(parseInt(label)) ? `${label}: ${value2}` : value2;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function echo$inspectObject(v) {
  const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${echo$inspect(k)}: ${echo$inspect(v[k])}`);
  }
  const body2 = props.length ? " " + props.join(", ") + " " : "";
  const head = name === "Object" ? "" : name + " ";
  return `//js(${head}{${body2}})`;
}
function echo$inspect(v) {
  const t = typeof v;
  if (v === true)
    return "True";
  if (v === false)
    return "False";
  if (v === null)
    return "//js(null)";
  if (v === void 0)
    return "Nil";
  if (t === "string")
    return echo$inspectString(v);
  if (t === "bigint" || t === "number")
    return v.toString();
  if (Array.isArray(v))
    return `#(${v.map(echo$inspect).join(", ")})`;
  if (v instanceof List)
    return `[${v.toArray().map(echo$inspect).join(", ")}]`;
  if (v instanceof UtfCodepoint)
    return `//utfcodepoint(${String.fromCodePoint(v.value)})`;
  if (v instanceof BitArray)
    return echo$inspectBitArray(v);
  if (v instanceof CustomType)
    return echo$inspectCustomType(v);
  if (echo$isDict(v))
    return echo$inspectDict(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(echo$inspect).join(", ")}))`;
  if (v instanceof RegExp)
    return `//js(${v})`;
  if (v instanceof Date)
    return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return echo$inspectObject(v);
}
function echo$inspectBitArray(bitArray) {
  let endOfAlignedBytes = bitArray.bitOffset + 8 * Math.trunc(bitArray.bitSize / 8);
  let alignedBytes = bitArraySlice(bitArray, bitArray.bitOffset, endOfAlignedBytes);
  let remainingUnalignedBits = bitArray.bitSize % 8;
  if (remainingUnalignedBits > 0) {
    let remainingBits = bitArraySliceToInt(bitArray, endOfAlignedBytes, bitArray.bitSize, false, false);
    let alignedBytesArray = Array.from(alignedBytes.rawBuffer);
    let suffix = `${remainingBits}:size(${remainingUnalignedBits})`;
    if (alignedBytesArray.length === 0) {
      return `<<${suffix}>>`;
    } else {
      return `<<${Array.from(alignedBytes.rawBuffer).join(", ")}, ${suffix}>>`;
    }
  } else {
    return `<<${Array.from(alignedBytes.rawBuffer).join(", ")}>>`;
  }
}
function echo$isDict(value2) {
  try {
    return value2 instanceof Dict;
  } catch {
    return false;
  }
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(all) {
    super();
    this.all = all;
  }
};
function custom(run3) {
  return new Effect(
    toList([
      (actions) => {
        return run3(actions.dispatch, actions.emit, actions.select, actions.root);
      }
    ])
  );
}
function from(effect) {
  return custom((dispatch, _, _1, _2) => {
    return effect(dispatch);
  });
}
function none() {
  return new Effect(toList([]));
}
function batch(effects) {
  return new Effect(
    fold(
      effects,
      toList([]),
      (b, _use1) => {
        let a = _use1.all;
        return append(b, a);
      }
    )
  );
}

// build/dev/javascript/lustre/lustre/internals/vdom.mjs
var Text = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Element2 = class extends CustomType {
  constructor(key3, namespace, tag, attrs, children2, self_closing, void$) {
    super();
    this.key = key3;
    this.namespace = namespace;
    this.tag = tag;
    this.attrs = attrs;
    this.children = children2;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Map2 = class extends CustomType {
  constructor(subtree) {
    super();
    this.subtree = subtree;
  }
};
var Attribute = class extends CustomType {
  constructor(x0, x1, as_property) {
    super();
    this[0] = x0;
    this[1] = x1;
    this.as_property = as_property;
  }
};
var Event2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function attribute_to_event_handler(attribute2) {
  if (attribute2 instanceof Attribute) {
    return new Error(void 0);
  } else {
    let name = attribute2[0];
    let handler = attribute2[1];
    let name$1 = drop_start(name, 2);
    return new Ok([name$1, handler]);
  }
}
function do_element_list_handlers(elements2, handlers2, key3) {
  return index_fold(
    elements2,
    handlers2,
    (handlers3, element3, index6) => {
      let key$1 = key3 + "-" + to_string(index6);
      return do_handlers(element3, handlers3, key$1);
    }
  );
}
function do_handlers(loop$element, loop$handlers, loop$key) {
  while (true) {
    let element3 = loop$element;
    let handlers2 = loop$handlers;
    let key3 = loop$key;
    if (element3 instanceof Text) {
      return handlers2;
    } else if (element3 instanceof Map2) {
      let subtree = element3.subtree;
      loop$element = subtree();
      loop$handlers = handlers2;
      loop$key = key3;
    } else {
      let attrs = element3.attrs;
      let children2 = element3.children;
      let handlers$1 = fold(
        attrs,
        handlers2,
        (handlers3, attr) => {
          let $ = attribute_to_event_handler(attr);
          if ($.isOk()) {
            let name = $[0][0];
            let handler = $[0][1];
            return insert(handlers3, key3 + "-" + name, handler);
          } else {
            return handlers3;
          }
        }
      );
      return do_element_list_handlers(children2, handlers$1, key3);
    }
  }
}
function handlers(element3) {
  return do_handlers(element3, new_map(), "0");
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name, value2) {
  return new Attribute(name, identity(value2), false);
}
function property(name, value2) {
  return new Attribute(name, identity(value2), true);
}
function on(name, handler) {
  return new Event2("on" + name, handler);
}
function style(properties) {
  return attribute(
    "style",
    fold(
      properties,
      "",
      (styles, _use1) => {
        let name$1 = _use1[0];
        let value$1 = _use1[1];
        return styles + name$1 + ":" + value$1 + ";";
      }
    )
  );
}
function class$(name) {
  return attribute("class", name);
}
function src(uri) {
  return attribute("src", uri);
}
function height(val) {
  return property("height", val);
}
function width(val) {
  return property("width", val);
}

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag, attrs, children2) {
  if (tag === "area") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "base") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "br") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "col") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "embed") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "hr") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "img") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "input") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "link") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "meta") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "param") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "source") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "track") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "wbr") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else {
    return new Element2("", "", tag, attrs, children2, false, false);
  }
}
function text(content) {
  return new Text(content);
}
function none2() {
  return new Text("");
}
function fragment(elements2) {
  return element(
    "lustre-fragment",
    toList([style(toList([["display", "contents"]]))]),
    elements2
  );
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict3) {
    super();
    this.dict = dict3;
  }
};
function new$3() {
  return new Set2(new_map());
}

// build/dev/javascript/lustre/lustre/internals/patch.mjs
var Diff = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Init = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function is_empty_element_diff(diff2) {
  return isEqual(diff2.created, new_map()) && isEqual(
    diff2.removed,
    new$3()
  ) && isEqual(diff2.updated, new_map());
}

// build/dev/javascript/lustre/lustre/internals/runtime.mjs
var Attrs = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Batch = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Debug = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Dispatch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Event3 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Shutdown = class extends CustomType {
};
var Subscribe = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Unsubscribe = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ForceModel = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre/vdom.ffi.mjs
if (globalThis.customElements && !globalThis.customElements.get("lustre-fragment")) {
  globalThis.customElements.define(
    "lustre-fragment",
    class LustreFragment extends HTMLElement {
      constructor() {
        super();
      }
    }
  );
}
function morph(prev, next, dispatch) {
  let out;
  let stack = [{ prev, next, parent: prev.parentNode }];
  while (stack.length) {
    let { prev: prev2, next: next2, parent } = stack.pop();
    while (next2.subtree !== void 0)
      next2 = next2.subtree();
    if (next2.content !== void 0) {
      if (!prev2) {
        const created = document.createTextNode(next2.content);
        parent.appendChild(created);
        out ??= created;
      } else if (prev2.nodeType === Node.TEXT_NODE) {
        if (prev2.textContent !== next2.content)
          prev2.textContent = next2.content;
        out ??= prev2;
      } else {
        const created = document.createTextNode(next2.content);
        parent.replaceChild(created, prev2);
        out ??= created;
      }
    } else if (next2.tag !== void 0) {
      const created = createElementNode({
        prev: prev2,
        next: next2,
        dispatch,
        stack
      });
      if (!prev2) {
        parent.appendChild(created);
      } else if (prev2 !== created) {
        parent.replaceChild(created, prev2);
      }
      out ??= created;
    }
  }
  return out;
}
function createElementNode({ prev, next, dispatch, stack }) {
  const namespace = next.namespace || "http://www.w3.org/1999/xhtml";
  const canMorph = prev && prev.nodeType === Node.ELEMENT_NODE && prev.localName === next.tag && prev.namespaceURI === (next.namespace || "http://www.w3.org/1999/xhtml");
  const el = canMorph ? prev : namespace ? document.createElementNS(namespace, next.tag) : document.createElement(next.tag);
  let handlersForEl;
  if (!registeredHandlers.has(el)) {
    const emptyHandlers = /* @__PURE__ */ new Map();
    registeredHandlers.set(el, emptyHandlers);
    handlersForEl = emptyHandlers;
  } else {
    handlersForEl = registeredHandlers.get(el);
  }
  const prevHandlers = canMorph ? new Set(handlersForEl.keys()) : null;
  const prevAttributes = canMorph ? new Set(Array.from(prev.attributes, (a) => a.name)) : null;
  let className = null;
  let style3 = null;
  let innerHTML = null;
  if (canMorph && next.tag === "textarea") {
    const innertText = next.children[Symbol.iterator]().next().value?.content;
    if (innertText !== void 0)
      el.value = innertText;
  }
  const delegated = [];
  for (const attr of next.attrs) {
    const name = attr[0];
    const value2 = attr[1];
    if (attr.as_property) {
      if (el[name] !== value2)
        el[name] = value2;
      if (canMorph)
        prevAttributes.delete(name);
    } else if (name.startsWith("on")) {
      const eventName = name.slice(2);
      const callback = dispatch(value2, eventName === "input");
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      if (canMorph)
        prevHandlers.delete(eventName);
    } else if (name.startsWith("data-lustre-on-")) {
      const eventName = name.slice(15);
      const callback = dispatch(lustreServerEventHandler);
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      el.setAttribute(name, value2);
      if (canMorph) {
        prevHandlers.delete(eventName);
        prevAttributes.delete(name);
      }
    } else if (name.startsWith("delegate:data-") || name.startsWith("delegate:aria-")) {
      el.setAttribute(name, value2);
      delegated.push([name.slice(10), value2]);
    } else if (name === "class") {
      className = className === null ? value2 : className + " " + value2;
    } else if (name === "style") {
      style3 = style3 === null ? value2 : style3 + value2;
    } else if (name === "dangerous-unescaped-html") {
      innerHTML = value2;
    } else {
      if (el.getAttribute(name) !== value2)
        el.setAttribute(name, value2);
      if (name === "value" || name === "selected")
        el[name] = value2;
      if (canMorph)
        prevAttributes.delete(name);
    }
  }
  if (className !== null) {
    el.setAttribute("class", className);
    if (canMorph)
      prevAttributes.delete("class");
  }
  if (style3 !== null) {
    el.setAttribute("style", style3);
    if (canMorph)
      prevAttributes.delete("style");
  }
  if (canMorph) {
    for (const attr of prevAttributes) {
      el.removeAttribute(attr);
    }
    for (const eventName of prevHandlers) {
      handlersForEl.delete(eventName);
      el.removeEventListener(eventName, lustreGenericEventHandler);
    }
  }
  if (next.tag === "slot") {
    window.queueMicrotask(() => {
      for (const child of el.assignedElements()) {
        for (const [name, value2] of delegated) {
          if (!child.hasAttribute(name)) {
            child.setAttribute(name, value2);
          }
        }
      }
    });
  }
  if (next.key !== void 0 && next.key !== "") {
    el.setAttribute("data-lustre-key", next.key);
  } else if (innerHTML !== null) {
    el.innerHTML = innerHTML;
    return el;
  }
  let prevChild = el.firstChild;
  let seenKeys = null;
  let keyedChildren = null;
  let incomingKeyedChildren = null;
  let firstChild = children(next).next().value;
  if (canMorph && firstChild !== void 0 && // Explicit checks are more verbose but truthy checks force a bunch of comparisons
  // we don't care about: it's never gonna be a number etc.
  firstChild.key !== void 0 && firstChild.key !== "") {
    seenKeys = /* @__PURE__ */ new Set();
    keyedChildren = getKeyedChildren(prev);
    incomingKeyedChildren = getKeyedChildren(next);
    for (const child of children(next)) {
      prevChild = diffKeyedChild(
        prevChild,
        child,
        el,
        stack,
        incomingKeyedChildren,
        keyedChildren,
        seenKeys
      );
    }
  } else {
    for (const child of children(next)) {
      stack.unshift({ prev: prevChild, next: child, parent: el });
      prevChild = prevChild?.nextSibling;
    }
  }
  while (prevChild) {
    const next2 = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = next2;
  }
  return el;
}
var registeredHandlers = /* @__PURE__ */ new WeakMap();
function lustreGenericEventHandler(event2) {
  const target2 = event2.currentTarget;
  if (!registeredHandlers.has(target2)) {
    target2.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target2);
  if (!handlersForEventTarget.has(event2.type)) {
    target2.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  handlersForEventTarget.get(event2.type)(event2);
}
function lustreServerEventHandler(event2) {
  const el = event2.currentTarget;
  const tag = el.getAttribute(`data-lustre-on-${event2.type}`);
  const data = JSON.parse(el.getAttribute("data-lustre-data") || "{}");
  const include = JSON.parse(el.getAttribute("data-lustre-include") || "[]");
  switch (event2.type) {
    case "input":
    case "change":
      include.push("target.value");
      break;
  }
  return {
    tag,
    data: include.reduce(
      (data2, property3) => {
        const path = property3.split(".");
        for (let i = 0, o = data2, e = event2; i < path.length; i++) {
          if (i === path.length - 1) {
            o[path[i]] = e[path[i]];
          } else {
            o[path[i]] ??= {};
            e = e[path[i]];
            o = o[path[i]];
          }
        }
        return data2;
      },
      { data }
    )
  };
}
function getKeyedChildren(el) {
  const keyedChildren = /* @__PURE__ */ new Map();
  if (el) {
    for (const child of children(el)) {
      const key3 = child?.key || child?.getAttribute?.("data-lustre-key");
      if (key3)
        keyedChildren.set(key3, child);
    }
  }
  return keyedChildren;
}
function diffKeyedChild(prevChild, child, el, stack, incomingKeyedChildren, keyedChildren, seenKeys) {
  while (prevChild && !incomingKeyedChildren.has(prevChild.getAttribute("data-lustre-key"))) {
    const nextChild = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = nextChild;
  }
  if (keyedChildren.size === 0) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  if (seenKeys.has(child.key)) {
    console.warn(`Duplicate key found in Lustre vnode: ${child.key}`);
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  seenKeys.add(child.key);
  const keyedChild = keyedChildren.get(child.key);
  if (!keyedChild && !prevChild) {
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild && prevChild !== null) {
    const placeholder = document.createTextNode("");
    el.insertBefore(placeholder, prevChild);
    stack.unshift({ prev: placeholder, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild || keyedChild === prevChild) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  el.insertBefore(keyedChild, prevChild);
  stack.unshift({ prev: keyedChild, next: child, parent: el });
  return prevChild;
}
function* children(element3) {
  for (const child of element3.children) {
    yield* forceChild(child);
  }
}
function* forceChild(element3) {
  if (element3.subtree !== void 0) {
    yield* forceChild(element3.subtree());
  } else {
    yield element3;
  }
}

// build/dev/javascript/lustre/lustre.ffi.mjs
var LustreClientApplication = class _LustreClientApplication {
  /**
   * @template Flags
   *
   * @param {object} app
   * @param {(flags: Flags) => [Model, Lustre.Effect<Msg>]} app.init
   * @param {(msg: Msg, model: Model) => [Model, Lustre.Effect<Msg>]} app.update
   * @param {(model: Model) => Lustre.Element<Msg>} app.view
   * @param {string | HTMLElement} selector
   * @param {Flags} flags
   *
   * @returns {Gleam.Ok<(action: Lustre.Action<Lustre.Client, Msg>>) => void>}
   */
  static start({ init: init3, update: update2, view: view2 }, selector, flags) {
    if (!is_browser())
      return new Error(new NotABrowser());
    const root = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root)
      return new Error(new ElementNotFound(selector));
    const app = new _LustreClientApplication(root, init3(flags), update2, view2);
    return new Ok((action) => app.send(action));
  }
  /**
   * @param {Element} root
   * @param {[Model, Lustre.Effect<Msg>]} init
   * @param {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} update
   * @param {(model: Model) => Lustre.Element<Msg>} view
   *
   * @returns {LustreClientApplication}
   */
  constructor(root, [init3, effects], update2, view2) {
    this.root = root;
    this.#model = init3;
    this.#update = update2;
    this.#view = view2;
    this.#tickScheduled = window.setTimeout(
      () => this.#tick(effects.all.toArray(), true),
      0
    );
  }
  /** @type {Element} */
  root;
  /**
   * @param {Lustre.Action<Lustre.Client, Msg>} action
   *
   * @returns {void}
   */
  send(action) {
    if (action instanceof Debug) {
      if (action[0] instanceof ForceModel) {
        this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
        this.#queue = [];
        this.#model = action[0][0];
        const vdom = this.#view(this.#model);
        const dispatch = (handler, immediate = false) => (event2) => {
          const result = handler(event2);
          if (result instanceof Ok) {
            this.send(new Dispatch(result[0], immediate));
          }
        };
        const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
        morph(prev, vdom, dispatch);
      }
    } else if (action instanceof Dispatch) {
      const msg = action[0];
      const immediate = action[1] ?? false;
      this.#queue.push(msg);
      if (immediate) {
        this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
        this.#tick();
      } else if (!this.#tickScheduled) {
        this.#tickScheduled = window.setTimeout(() => this.#tick());
      }
    } else if (action instanceof Emit2) {
      const event2 = action[0];
      const data = action[1];
      this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
    } else if (action instanceof Shutdown) {
      this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
      this.#model = null;
      this.#update = null;
      this.#view = null;
      this.#queue = null;
      while (this.root.firstChild) {
        this.root.firstChild.remove();
      }
    }
  }
  /** @type {Model} */
  #model;
  /** @type {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} */
  #update;
  /** @type {(model: Model) => Lustre.Element<Msg>} */
  #view;
  /** @type {Array<Msg>} */
  #queue = [];
  /** @type {number | undefined} */
  #tickScheduled;
  /**
   * @param {Lustre.Effect<Msg>[]} effects
   */
  #tick(effects = []) {
    this.#tickScheduled = void 0;
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const dispatch = (handler, immediate = false) => (event2) => {
      const result = handler(event2);
      if (result instanceof Ok) {
        this.send(new Dispatch(result[0], immediate));
      }
    };
    const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
    morph(prev, vdom, dispatch);
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = this.root;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start = LustreClientApplication.start;
var LustreServerApplication = class _LustreServerApplication {
  static start({ init: init3, update: update2, view: view2, on_attribute_change }, flags) {
    const app = new _LustreServerApplication(
      init3(flags),
      update2,
      view2,
      on_attribute_change
    );
    return new Ok((action) => app.send(action));
  }
  constructor([model, effects], update2, view2, on_attribute_change) {
    this.#model = model;
    this.#update = update2;
    this.#view = view2;
    this.#html = view2(model);
    this.#onAttributeChange = on_attribute_change;
    this.#renderers = /* @__PURE__ */ new Map();
    this.#handlers = handlers(this.#html);
    this.#tick(effects.all.toArray());
  }
  send(action) {
    if (action instanceof Attrs) {
      for (const attr of action[0]) {
        const decoder = this.#onAttributeChange.get(attr[0]);
        if (!decoder)
          continue;
        const msg = decoder(attr[1]);
        if (msg instanceof Error)
          continue;
        this.#queue.push(msg);
      }
      this.#tick();
    } else if (action instanceof Batch) {
      this.#queue = this.#queue.concat(action[0].toArray());
      this.#tick(action[1].all.toArray());
    } else if (action instanceof Debug) {
    } else if (action instanceof Dispatch) {
      this.#queue.push(action[0]);
      this.#tick();
    } else if (action instanceof Emit2) {
      const event2 = new Emit(action[0], action[1]);
      for (const [_, renderer] of this.#renderers) {
        renderer(event2);
      }
    } else if (action instanceof Event3) {
      const handler = this.#handlers.get(action[0]);
      if (!handler)
        return;
      const msg = handler(action[1]);
      if (msg instanceof Error)
        return;
      this.#queue.push(msg[0]);
      this.#tick();
    } else if (action instanceof Subscribe) {
      const attrs = keys(this.#onAttributeChange);
      const patch = new Init(attrs, this.#html);
      this.#renderers = this.#renderers.set(action[0], action[1]);
      action[1](patch);
    } else if (action instanceof Unsubscribe) {
      this.#renderers = this.#renderers.delete(action[0]);
    }
  }
  #model;
  #update;
  #queue;
  #view;
  #html;
  #renderers;
  #handlers;
  #onAttributeChange;
  #tick(effects = []) {
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const diff2 = elements(this.#html, vdom);
    if (!is_empty_element_diff(diff2)) {
      const patch = new Diff(diff2);
      for (const [_, renderer] of this.#renderers) {
        renderer(patch);
      }
    }
    this.#html = vdom;
    this.#handlers = diff2.handlers;
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = null;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start_server_application = LustreServerApplication.start;
var is_browser = () => globalThis.window && window.document;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init3, update2, view2, on_attribute_change) {
    super();
    this.init = init3;
    this.update = update2;
    this.view = view2;
    this.on_attribute_change = on_attribute_change;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init3, update2, view2) {
  return new App(init3, update2, view2, new None());
}
function start2(app, selector, flags) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, flags);
    }
  );
}

// build/dev/javascript/lustre/lustre/event.mjs
function on2(name, handler) {
  return on(name, handler);
}
function on_click(msg) {
  return on2("click", (_) => {
    return new Ok(msg);
  });
}

// build/dev/javascript/plinth/window_ffi.mjs
function self() {
  return globalThis;
}
function alert(message) {
  window.alert(message);
}
function prompt(message, defaultValue) {
  let text5 = window.prompt(message, defaultValue);
  if (text5 !== null) {
    return new Ok(text5);
  } else {
    return new Error();
  }
}
function addEventListener3(type, listener) {
  return window.addEventListener(type, listener);
}
function document2(window2) {
  return window2.document;
}
async function requestWakeLock() {
  try {
    return new Ok(await window.navigator.wakeLock.request("screen"));
  } catch (error) {
    return new Error(error.toString());
  }
}
function location() {
  return window.location.href;
}
function locationOf(w) {
  try {
    return new Ok(w.location.href);
  } catch (error) {
    return new Error(error.toString());
  }
}
function setLocation(w, url) {
  w.location.href = url;
}
function origin() {
  return window.location.origin;
}
function pathname() {
  return window.location.pathname;
}
function reload() {
  return window.location.reload();
}
function reloadOf(w) {
  return w.location.reload();
}
function focus2(w) {
  return w.focus();
}
function getHash2() {
  const hash3 = window.location.hash;
  if (hash3 == "") {
    return new Error();
  }
  return new Ok(decodeURIComponent(hash3.slice(1)));
}
function getSearch() {
  const search = window.location.search;
  if (search == "") {
    return new Error();
  }
  return new Ok(decodeURIComponent(search.slice(1)));
}
function innerHeight(w) {
  return w.innerHeight;
}
function innerWidth(w) {
  return w.innerWidth;
}
function outerHeight(w) {
  return w.outerHeight;
}
function outerWidth(w) {
  return w.outerWidth;
}
function screenX(w) {
  return w.screenX;
}
function screenY(w) {
  return w.screenY;
}
function screenTop(w) {
  return w.screenTop;
}
function screenLeft(w) {
  return w.screenLeft;
}
function scrollX(w) {
  return w.scrollX;
}
function scrollY(w) {
  return w.scrollY;
}
function open(url, target2, features) {
  try {
    return new Ok(window.open(url, target2, features));
  } catch (error) {
    return new Error(error.toString());
  }
}
function close(w) {
  w.close();
}
function closed(w) {
  return w.closed;
}
function queueMicrotask(callback) {
  return window.queueMicrotask(callback);
}
function requestAnimationFrame(callback) {
  return window.requestAnimationFrame(callback);
}
function cancelAnimationFrame(callback) {
  return window.cancelAnimationFrame(callback);
}
function eval_(string) {
  try {
    return new Ok(eval(string));
  } catch (error) {
    return new Error(error.toString());
  }
}
async function import_(string7) {
  try {
    return new Ok(await import(string7));
  } catch (error) {
    return new Error(error.toString());
  }
}

// build/dev/javascript/plinth/storage_ffi.mjs
function localStorage() {
  try {
    if (globalThis.Storage && globalThis.localStorage instanceof globalThis.Storage) {
      return new Ok(globalThis.localStorage);
    } else {
      return new Error(null);
    }
  } catch {
    return new Error(null);
  }
}
function getItem(storage, keyName) {
  return null_or(storage.getItem(keyName));
}
function setItem(storage, keyName, keyValue) {
  try {
    storage.setItem(keyName, keyValue);
    return new Ok(null);
  } catch {
    return new Error(null);
  }
}
function removeItem(storage, keyName) {
  storage.removeItem(keyName);
}
function null_or(val) {
  if (val !== null) {
    return new Ok(val);
  } else {
    return new Error(null);
  }
}

// build/dev/javascript/sketch/sketch/internals/string.mjs
function indent(indent2) {
  return repeat(" ", indent2);
}
function wrap_class(id, properties, indentation, pseudo) {
  let base_indent = indent(indentation);
  let pseudo_ = unwrap(pseudo, "");
  let _pipe = prepend(base_indent + id + pseudo_ + " {", properties);
  let _pipe$1 = join(_pipe, "\n");
  return append3(_pipe$1, "\n" + base_indent + "}");
}

// build/dev/javascript/sketch/xxhash.ffi.bin.mjs
var wasmBytes = "AGFzbQEAAAABMAhgA39/fwF/YAN/f38AYAJ/fwBgAX8Bf2ADf39+AX5gA35/fwF+YAJ/fgBgAX8BfgMLCgAAAgEDBAUGAQcFAwEAAQdVCQNtZW0CAAV4eGgzMgAABmluaXQzMgACCHVwZGF0ZTMyAAMIZGlnZXN0MzIABAV4eGg2NAAFBmluaXQ2NAAHCHVwZGF0ZTY0AAgIZGlnZXN0NjQACQr7FgryAQEEfyAAIAFqIQMgAUEQTwR/IANBEGshBiACQaiIjaECaiEDIAJBievQ0AdrIQQgAkHPjKKOBmohBQNAIAMgACgCAEH3lK+veGxqQQ13QbHz3fF5bCEDIAQgAEEEaiIAKAIAQfeUr694bGpBDXdBsfPd8XlsIQQgAiAAQQRqIgAoAgBB95Svr3hsakENd0Gx893xeWwhAiAFIABBBGoiACgCAEH3lK+veGxqQQ13QbHz3fF5bCEFIAYgAEEEaiIATw0ACyACQQx3IAVBEndqIARBB3dqIANBAXdqBSACQbHP2bIBagsgAWogACABQQ9xEAELkgEAIAEgAmohAgNAIAFBBGogAktFBEAgACABKAIAQb3cypV8bGpBEXdBr9bTvgJsIQAgAUEEaiEBDAELCwNAIAEgAk9FBEAgACABLQAAQbHP2bIBbGpBC3dBsfPd8XlsIQAgAUEBaiEBDAELCyAAIABBD3ZzQfeUr694bCIAQQ12IABzQb3cypV8bCIAQRB2IABzCz8AIABBCGogAUGoiI2hAmo2AgAgAEEMaiABQYnr0NAHazYCACAAQRBqIAE2AgAgAEEUaiABQc+Moo4GajYCAAvDBAEGfyABIAJqIQYgAEEYaiEEIABBKGooAgAhAyAAIAAoAgAgAmo2AgAgAEEEaiIFIAUoAgAgAkEQTyAAKAIAQRBPcnI2AgAgAiADakEQSQRAIAMgBGogASAC/AoAACAAQShqIAIgA2o2AgAPCyADBEAgAyAEaiABQRAgA2siAvwKAAAgAEEIaiIDIAMoAgAgBCgCAEH3lK+veGxqQQ13QbHz3fF5bDYCACAAQQxqIgMgAygCACAEQQRqKAIAQfeUr694bGpBDXdBsfPd8XlsNgIAIABBEGoiAyADKAIAIARBCGooAgBB95Svr3hsakENd0Gx893xeWw2AgAgAEEUaiIDIAMoAgAgBEEMaigCAEH3lK+veGxqQQ13QbHz3fF5bDYCACAAQShqQQA2AgAgASACaiEBCyABIAZBEGtNBEAgBkEQayEIIABBCGooAgAhAiAAQQxqKAIAIQMgAEEQaigCACEFIABBFGooAgAhBwNAIAIgASgCAEH3lK+veGxqQQ13QbHz3fF5bCECIAMgAUEEaiIBKAIAQfeUr694bGpBDXdBsfPd8XlsIQMgBSABQQRqIgEoAgBB95Svr3hsakENd0Gx893xeWwhBSAHIAFBBGoiASgCAEH3lK+veGxqQQ13QbHz3fF5bCEHIAggAUEEaiIBTw0ACyAAQQhqIAI2AgAgAEEMaiADNgIAIABBEGogBTYCACAAQRRqIAc2AgALIAEgBkkEQCAEIAEgBiABayIB/AoAACAAQShqIAE2AgALC2EBAX8gAEEQaigCACEBIABBBGooAgAEfyABQQx3IABBFGooAgBBEndqIABBDGooAgBBB3dqIABBCGooAgBBAXdqBSABQbHP2bIBagsgACgCAGogAEEYaiAAQShqKAIAEAEL/wMCA34BfyAAIAFqIQYgAUEgTwR+IAZBIGshBiACQtbrgu7q/Yn14AB8IQMgAkKxqazBrbjUpj19IQQgAkL56tDQ58mh5OEAfCEFA0AgAyAAKQMAQs/W077Sx6vZQn58Qh+JQoeVr6+Ytt6bnn9+IQMgBCAAQQhqIgApAwBCz9bTvtLHq9lCfnxCH4lCh5Wvr5i23puef34hBCACIABBCGoiACkDAELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fiECIAUgAEEIaiIAKQMAQs/W077Sx6vZQn58Qh+JQoeVr6+Ytt6bnn9+IQUgBiAAQQhqIgBPDQALIAJCDIkgBUISiXwgBEIHiXwgA0IBiXwgA0LP1tO+0ser2UJ+Qh+JQoeVr6+Ytt6bnn9+hUKHla+vmLbem55/fkKdo7Xqg7GNivoAfSAEQs/W077Sx6vZQn5CH4lCh5Wvr5i23puef36FQoeVr6+Ytt6bnn9+Qp2jteqDsY2K+gB9IAJCz9bTvtLHq9lCfkIfiUKHla+vmLbem55/foVCh5Wvr5i23puef35CnaO16oOxjYr6AH0gBULP1tO+0ser2UJ+Qh+JQoeVr6+Ytt6bnn9+hUKHla+vmLbem55/fkKdo7Xqg7GNivoAfQUgAkLFz9my8eW66id8CyABrXwgACABQR9xEAYLhgIAIAEgAmohAgNAIAIgAUEIak8EQCABKQMAQs/W077Sx6vZQn5CH4lCh5Wvr5i23puef34gAIVCG4lCh5Wvr5i23puef35CnaO16oOxjYr6AH0hACABQQhqIQEMAQsLIAFBBGogAk0EQCAAIAE1AgBCh5Wvr5i23puef36FQheJQs/W077Sx6vZQn5C+fPd8Zn2masWfCEAIAFBBGohAQsDQCABIAJJBEAgACABMQAAQsXP2bLx5brqJ36FQguJQoeVr6+Ytt6bnn9+IQAgAUEBaiEBDAELCyAAIABCIYiFQs/W077Sx6vZQn4iACAAQh2IhUL5893xmfaZqxZ+IgAgAEIgiIULTQAgAEEIaiABQtbrgu7q/Yn14AB8NwMAIABBEGogAUKxqazBrbjUpj19NwMAIABBGGogATcDACAAQSBqIAFC+erQ0OfJoeThAHw3AwAL9AQCA38EfiABIAJqIQUgAEEoaiEEIABByABqKAIAIQMgACAAKQMAIAKtfDcDACACIANqQSBJBEAgAyAEaiABIAL8CgAAIABByABqIAIgA2o2AgAPCyADBEAgAyAEaiABQSAgA2siAvwKAAAgAEEIaiIDIAMpAwAgBCkDAELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fjcDACAAQRBqIgMgAykDACAEQQhqKQMAQs/W077Sx6vZQn58Qh+JQoeVr6+Ytt6bnn9+NwMAIABBGGoiAyADKQMAIARBEGopAwBCz9bTvtLHq9lCfnxCH4lCh5Wvr5i23puef343AwAgAEEgaiIDIAMpAwAgBEEYaikDAELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fjcDACAAQcgAakEANgIAIAEgAmohAQsgAUEgaiAFTQRAIAVBIGshAiAAQQhqKQMAIQYgAEEQaikDACEHIABBGGopAwAhCCAAQSBqKQMAIQkDQCAGIAEpAwBCz9bTvtLHq9lCfnxCH4lCh5Wvr5i23puef34hBiAHIAFBCGoiASkDAELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fiEHIAggAUEIaiIBKQMAQs/W077Sx6vZQn58Qh+JQoeVr6+Ytt6bnn9+IQggCSABQQhqIgEpAwBCz9bTvtLHq9lCfnxCH4lCh5Wvr5i23puef34hCSACIAFBCGoiAU8NAAsgAEEIaiAGNwMAIABBEGogBzcDACAAQRhqIAg3AwAgAEEgaiAJNwMACyABIAVJBEAgBCABIAUgAWsiAfwKAAAgAEHIAGogATYCAAsLvAIBBX4gAEEYaikDACEBIAApAwAiAkIgWgR+IABBCGopAwAiA0IBiSAAQRBqKQMAIgRCB4l8IAFCDIkgAEEgaikDACIFQhKJfHwgA0LP1tO+0ser2UJ+Qh+JQoeVr6+Ytt6bnn9+hUKHla+vmLbem55/fkKdo7Xqg7GNivoAfSAEQs/W077Sx6vZQn5CH4lCh5Wvr5i23puef36FQoeVr6+Ytt6bnn9+Qp2jteqDsY2K+gB9IAFCz9bTvtLHq9lCfkIfiUKHla+vmLbem55/foVCh5Wvr5i23puef35CnaO16oOxjYr6AH0gBULP1tO+0ser2UJ+Qh+JQoeVr6+Ytt6bnn9+hUKHla+vmLbem55/fkKdo7Xqg7GNivoAfQUgAULFz9my8eW66id8CyACfCAAQShqIAJCH4OnEAYL";

// build/dev/javascript/sketch/xxhash.ffi.mjs
var u32_BYTES = 4;
var u64_BYTES = 8;
var XXH32_STATE_SIZE_BYTES = u32_BYTES + // total_len
u32_BYTES + // large_len
u32_BYTES * 4 + // Accumulator lanes
u32_BYTES * 4 + // Internal buffer
u32_BYTES + // memsize
u32_BYTES;
var XXH64_STATE_SIZE_BYTES = u64_BYTES + // total_len
u64_BYTES * 4 + // Accumulator lanes
u64_BYTES * 4 + // Internal buffer
u32_BYTES + // memsize
u32_BYTES + // reserved32
u64_BYTES;
function xxhash() {
  const bytes = Uint8Array.from(atob(wasmBytes), (c) => c.charCodeAt(0));
  const mod = new WebAssembly.Module(bytes);
  const {
    exports: {
      mem,
      xxh32,
      xxh64,
      init32,
      update32,
      digest32,
      init64,
      update64,
      digest64
    }
  } = new WebAssembly.Instance(mod);
  let memory = new Uint8Array(mem.buffer);
  function growMemory(length5, offset) {
    if (mem.buffer.byteLength < length5 + offset) {
      const extraPages = Math.ceil(
        // Wasm pages are spec'd to 64K
        (length5 + offset - mem.buffer.byteLength) / (64 * 1024)
      );
      mem.grow(extraPages);
      memory = new Uint8Array(mem.buffer);
    }
  }
  function create2(size, seed, init3, update2, digest, finalize) {
    growMemory(size);
    const state = new Uint8Array(size);
    memory.set(state);
    init3(0, seed);
    state.set(memory.slice(0, size));
    return {
      update(input) {
        memory.set(state);
        let length5;
        if (typeof input === "string") {
          growMemory(input.length * 3, size);
          length5 = encoder.encodeInto(input, memory.subarray(size)).written;
        } else {
          growMemory(input.byteLength, size);
          memory.set(input, size);
          length5 = input.byteLength;
        }
        update2(0, size, length5);
        state.set(memory.slice(0, size));
        return this;
      },
      digest() {
        memory.set(state);
        return finalize(digest(0));
      }
    };
  }
  function forceUnsigned32(i) {
    return i >>> 0;
  }
  const u64Max = 2n ** 64n - 1n;
  function forceUnsigned64(i) {
    return i & u64Max;
  }
  const encoder = new TextEncoder();
  const defaultSeed = 0;
  const defaultBigSeed = 0n;
  function h32(str, seed = defaultSeed) {
    growMemory(str.length * 3, 0);
    return forceUnsigned32(
      xxh32(0, encoder.encodeInto(str, memory).written, seed)
    );
  }
  function h64(str, seed = defaultBigSeed) {
    growMemory(str.length * 3, 0);
    return forceUnsigned64(
      xxh64(0, encoder.encodeInto(str, memory).written, seed)
    );
  }
  return {
    h32,
    h32ToString(str, seed = defaultSeed) {
      return h32(str, seed).toString(16).padStart(8, "0");
    },
    h32Raw(inputBuffer, seed = defaultSeed) {
      growMemory(inputBuffer.byteLength, 0);
      memory.set(inputBuffer);
      return forceUnsigned32(xxh32(0, inputBuffer.byteLength, seed));
    },
    create32(seed = defaultSeed) {
      return create2(
        XXH32_STATE_SIZE_BYTES,
        seed,
        init32,
        update32,
        digest32,
        forceUnsigned32
      );
    },
    h64,
    h64ToString(str, seed = defaultBigSeed) {
      return h64(str, seed).toString(16).padStart(16, "0");
    },
    h64Raw(inputBuffer, seed = defaultBigSeed) {
      growMemory(inputBuffer.byteLength, 0);
      memory.set(inputBuffer);
      return forceUnsigned64(xxh64(0, inputBuffer.byteLength, seed));
    },
    create64(seed = defaultBigSeed) {
      return create2(
        XXH64_STATE_SIZE_BYTES,
        seed,
        init64,
        update64,
        digest64,
        forceUnsigned64
      );
    }
  };
}
var hasher = xxhash();
function xxHash32(content) {
  return hasher.h32(content);
}

// build/dev/javascript/sketch/sketch/internals/cache/cache.mjs
var Class = class extends CustomType {
  constructor(as_string, content, name) {
    super();
    this.as_string = as_string;
    this.content = content;
    this.name = name;
  }
};
var Definitions = class extends CustomType {
  constructor(medias, selectors, class$5) {
    super();
    this.medias = medias;
    this.selectors = selectors;
    this.class = class$5;
  }
};
var ComputedClass = class extends CustomType {
  constructor(id, name, class_name3, definitions) {
    super();
    this.id = id;
    this.name = name;
    this.class_name = class_name3;
    this.definitions = definitions;
  }
};
var Cache = class extends CustomType {
  constructor(cache, at_rules) {
    super();
    this.cache = cache;
    this.at_rules = at_rules;
  }
};
var Media = class extends CustomType {
  constructor(query, styles) {
    super();
    this.query = query;
    this.styles = styles;
  }
};
var Selector = class extends CustomType {
  constructor(selector, styles) {
    super();
    this.selector = selector;
    this.styles = styles;
  }
};
var Combinator = class extends CustomType {
  constructor(selector, class$5, styles) {
    super();
    this.selector = selector;
    this.class = class$5;
    this.styles = styles;
  }
};
var Property = class extends CustomType {
  constructor(key3, value2, important) {
    super();
    this.key = key3;
    this.value = value2;
    this.important = important;
  }
};
var NoStyle = class extends CustomType {
};
var Properties = class extends CustomType {
  constructor(properties, medias, selectors, indentation) {
    super();
    this.properties = properties;
    this.medias = medias;
    this.selectors = selectors;
    this.indentation = indentation;
  }
};
var MediaProperty = class extends CustomType {
  constructor(query, properties, selectors) {
    super();
    this.query = query;
    this.properties = properties;
    this.selectors = selectors;
  }
};
var SelectorProperty = class extends CustomType {
  constructor(selector, properties) {
    super();
    this.selector = selector;
    this.properties = properties;
  }
};
function new$4() {
  return new Cache(new_map(), new_map());
}
function class$2(content) {
  let as_string = inspect2(content);
  return new Class(as_string, content, new None());
}
function empty_computed() {
  let definitions = new Definitions(toList([]), toList([]), "");
  return new ComputedClass(0, "", "", definitions);
}
function wrap_selectors(id, indentation, selectors) {
  return map2(
    selectors,
    (selector) => {
      let selector$1 = selector.selector;
      let properties = selector.properties;
      return wrap_class(
        id,
        properties,
        indentation,
        new Some(selector$1)
      );
    }
  );
}
function compute_classes(id, name, properties) {
  let class_name$1 = lazy_unwrap(
    name,
    () => {
      return "css-" + to_string(id);
    }
  );
  let name$1 = lazy_unwrap(
    name,
    () => {
      return ".css-" + to_string(id);
    }
  );
  let properties$1 = properties.properties;
  let medias = properties.medias;
  let selectors = properties.selectors;
  let class$1 = wrap_class(name$1, properties$1, 0, new None());
  let selectors$1 = wrap_selectors(name$1, 0, selectors);
  return new ComputedClass(
    id,
    name$1,
    class_name$1,
    new Definitions(
      map2(
        medias,
        (_use0) => {
          let query = _use0.query;
          let properties$2 = _use0.properties;
          let selectors$2 = _use0.selectors;
          let selectors$3 = wrap_selectors(name$1, 2, selectors$2);
          let _pipe = toList([
            query + " {",
            wrap_class(name$1, properties$2, 2, new None())
          ]);
          let _pipe$1 = ((_capture) => {
            return prepend2(toList([selectors$3, toList(["}"])]), _capture);
          })(_pipe);
          let _pipe$2 = flatten(_pipe$1);
          return join(_pipe$2, "\n");
        }
      ),
      selectors$1,
      class$1
    )
  );
}
function compute_property(indent2, key3, value2, important) {
  let base_indent = indent(indent2);
  let important$1 = (() => {
    if (important) {
      return " !important";
    } else {
      return "";
    }
  })();
  return base_indent + key3 + ": " + value2 + important$1 + ";";
}
function handle_property(props, property3) {
  if (!(property3 instanceof Property)) {
    throw makeError(
      "let_assert",
      "sketch/internals/cache/cache",
      243,
      "handle_property",
      "Pattern match failed, no pattern matched the value.",
      { value: property3 }
    );
  }
  let key3 = property3.key;
  let value2 = property3.value;
  let important = property3.important;
  let css_property = compute_property(props.indentation, key3, value2, important);
  let properties = prepend(css_property, props.properties);
  let _record = props;
  return new Properties(
    properties,
    _record.medias,
    _record.selectors,
    _record.indentation
  );
}
function merge_computed_properties(target2, argument) {
  return new Properties(
    append(argument.properties, target2.properties),
    append(argument.medias, target2.medias),
    append(argument.selectors, target2.selectors),
    target2.indentation
  );
}
function get_definitions(class$5) {
  let $ = class$5.definitions;
  let medias = $.medias;
  let selectors = $.selectors;
  let class$1 = $.class;
  let _pipe = toList([toList([class$1]), selectors, medias]);
  return flatten(_pipe);
}
function render_sheet(cache) {
  let _pipe = values(cache.at_rules);
  let _pipe$1 = append(
    _pipe,
    (() => {
      let _pipe$12 = values(cache.cache);
      return flat_map(_pipe$12, (c) => {
        return get_definitions(c[0]);
      });
    })()
  );
  return join(_pipe$1, "\n\n");
}
function handle_combinator(cache, props, combinator, existing_selector) {
  if (!(combinator instanceof Combinator)) {
    throw makeError(
      "let_assert",
      "sketch/internals/cache/cache",
      288,
      "handle_combinator",
      "Pattern match failed, no pattern matched the value.",
      { value: combinator }
    );
  }
  let selector = combinator.selector;
  let class$1 = combinator.class;
  let styles = combinator.styles;
  let indentation = props.indentation + 2;
  let $ = computed_class(class$1, cache);
  let cache$1 = $[0];
  let class$22 = $[1];
  let selector$1 = existing_selector + selector + class$22.name;
  let $1 = compute_properties(cache$1, styles, indentation, selector$1);
  let cache$2 = $1[0];
  let properties = $1[1];
  let _pipe = new SelectorProperty(selector$1, properties.properties);
  let _pipe$1 = ((_capture) => {
    return prepend2(properties.selectors, _capture);
  })(_pipe);
  let _pipe$2 = append(_pipe$1, props.selectors);
  let _pipe$3 = ((selectors) => {
    let _record = props;
    return new Properties(
      _record.properties,
      _record.medias,
      selectors,
      _record.indentation
    );
  })(_pipe$2);
  return ((_capture) => {
    return new$(cache$2, _capture);
  })(_pipe$3);
}
function compute_properties(cache, properties, indentation, existing_selector) {
  let init3 = new Properties(toList([]), toList([]), toList([]), indentation);
  return fold(
    reverse(properties),
    [cache, init3],
    (_use0, p) => {
      let cache$1 = _use0[0];
      let acc = _use0[1];
      if (p instanceof NoStyle) {
        return [cache$1, acc];
      } else if (p instanceof Property) {
        return [cache$1, handle_property(acc, p)];
      } else if (p instanceof Media) {
        return handle_media(cache$1, acc, p);
      } else if (p instanceof Selector) {
        return handle_selector(cache$1, acc, p, existing_selector);
      } else if (p instanceof Combinator) {
        return handle_combinator(cache$1, acc, p, existing_selector);
      } else {
        let class$1 = p.class;
        let $ = map_get(cache$1.cache, class$1.as_string);
        if ($.isOk()) {
          let props = $[0][1];
          return [cache$1, merge_computed_properties(acc, props)];
        } else {
          let _pipe = compute_properties(
            cache$1,
            class$1.content,
            indentation,
            ""
          );
          return map_second(
            _pipe,
            (_capture) => {
              return merge_computed_properties(acc, _capture);
            }
          );
        }
      }
    }
  );
}
function insert_class_in_cache(cache, class$5) {
  let $ = compute_properties(cache, class$5.content, 2, "");
  let cache$1 = $[0];
  let properties = $[1];
  let class_ = (() => {
    let _pipe2 = class$5.as_string;
    let _pipe$12 = xxHash32(_pipe2);
    return compute_classes(_pipe$12, class$5.name, properties);
  })();
  let _pipe = class_;
  let _pipe$1 = new$(_pipe, properties);
  let _pipe$2 = ((_capture) => {
    return insert(cache$1.cache, class$5.as_string, _capture);
  })(_pipe$1);
  let _pipe$3 = ((cache_) => {
    let _record = cache$1;
    return new Cache(cache_, _record.at_rules);
  })(_pipe$2);
  return new$(_pipe$3, class_);
}
function computed_class(class$5, cache) {
  return lazy_guard(
    is_empty(class$5.content),
    () => {
      return [cache, empty_computed()];
    },
    () => {
      let existing_class = map_get(cache.cache, class$5.as_string);
      if (existing_class.isOk()) {
        let class$1 = existing_class[0][0];
        return [cache, class$1];
      } else {
        return insert_class_in_cache(cache, class$5);
      }
    }
  );
}
function class_name(class$5, cache) {
  let _pipe = computed_class(class$5, cache);
  return map_second(_pipe, (class$6) => {
    return class$6.class_name;
  });
}
function handle_media(cache, props, media) {
  if (!(media instanceof Media)) {
    throw makeError(
      "let_assert",
      "sketch/internals/cache/cache",
      254,
      "handle_media",
      "Pattern match failed, no pattern matched the value.",
      { value: media }
    );
  }
  let query = media.query;
  let styles = media.styles;
  let indentation = props.indentation + 2;
  let $ = compute_properties(cache, styles, indentation, "");
  let cache$1 = $[0];
  let properties = $[1];
  let properties$1 = properties.properties;
  let selectors = properties.selectors;
  let _pipe = new MediaProperty(query, properties$1, selectors);
  let _pipe$1 = ((_capture) => {
    return prepend2(props.medias, _capture);
  })(
    _pipe
  );
  let _pipe$2 = ((medias) => {
    let _record = props;
    return new Properties(
      _record.properties,
      medias,
      _record.selectors,
      _record.indentation
    );
  })(_pipe$1);
  return ((_capture) => {
    return new$(cache$1, _capture);
  })(_pipe$2);
}
function handle_selector(cache, props, selector, existing_selector) {
  if (!(selector instanceof Selector)) {
    throw makeError(
      "let_assert",
      "sketch/internals/cache/cache",
      270,
      "handle_selector",
      "Pattern match failed, no pattern matched the value.",
      { value: selector }
    );
  }
  let selector$1 = selector.selector;
  let styles = selector.styles;
  let indentation = props.indentation + 2;
  let selector$2 = existing_selector + selector$1;
  let $ = compute_properties(cache, styles, indentation, selector$2);
  let cache$1 = $[0];
  let properties = $[1];
  let _pipe = new SelectorProperty(selector$2, properties.properties);
  let _pipe$1 = ((_capture) => {
    return prepend2(properties.selectors, _capture);
  })(_pipe);
  let _pipe$2 = append(_pipe$1, props.selectors);
  let _pipe$3 = ((selectors) => {
    let _record = props;
    return new Properties(
      _record.properties,
      _record.medias,
      selectors,
      _record.indentation
    );
  })(_pipe$2);
  return ((_capture) => {
    return new$(cache$1, _capture);
  })(_pipe$3);
}

// build/dev/javascript/sketch/sketch/css/length.mjs
var Px = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Cm = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Mm = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Q = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var In = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Pc = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Pt = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Vh = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Vw = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Em = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Rem = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Lh = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Rlh = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Ch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Pct = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Cap = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Ex = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Ic = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Rcap = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Rch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Rex = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Ric = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Vmax = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Vb = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Vi = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Cqw = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Cqh = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Cqi = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Cqb = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Cqmin = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Cqmax = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function px(value2) {
  return new Px(identity(value2));
}
function to_string3(size) {
  if (size instanceof Px) {
    let value2 = size[0];
    return append3(float_to_string(value2), "px");
  } else if (size instanceof Pt) {
    let value2 = size[0];
    return append3(float_to_string(value2), "pt");
  } else if (size instanceof Pct) {
    let value2 = size[0];
    return append3(float_to_string(value2), "%");
  } else if (size instanceof Vh) {
    let value2 = size[0];
    return append3(float_to_string(value2), "vh");
  } else if (size instanceof Vw) {
    let value2 = size[0];
    return append3(float_to_string(value2), "vw");
  } else if (size instanceof Em) {
    let value2 = size[0];
    return append3(float_to_string(value2), "em");
  } else if (size instanceof Rem) {
    let value2 = size[0];
    return append3(float_to_string(value2), "rem");
  } else if (size instanceof Lh) {
    let value2 = size[0];
    return append3(float_to_string(value2), "lh");
  } else if (size instanceof Rlh) {
    let value2 = size[0];
    return append3(float_to_string(value2), "rlh");
  } else if (size instanceof Ch) {
    let value2 = size[0];
    return append3(float_to_string(value2), "ch");
  } else if (size instanceof Cap) {
    let value2 = size[0];
    return append3(float_to_string(value2), "cap");
  } else if (size instanceof Cm) {
    let value2 = size[0];
    return append3(float_to_string(value2), "cm");
  } else if (size instanceof Cqb) {
    let value2 = size[0];
    return append3(float_to_string(value2), "cqb");
  } else if (size instanceof Cqh) {
    let value2 = size[0];
    return append3(float_to_string(value2), "cqh");
  } else if (size instanceof Cqi) {
    let value2 = size[0];
    return append3(float_to_string(value2), "cqi");
  } else if (size instanceof Cqmax) {
    let value2 = size[0];
    return append3(float_to_string(value2), "cqmax");
  } else if (size instanceof Cqmin) {
    let value2 = size[0];
    return append3(float_to_string(value2), "cqmin");
  } else if (size instanceof Cqw) {
    let value2 = size[0];
    return append3(float_to_string(value2), "cqw");
  } else if (size instanceof Ex) {
    let value2 = size[0];
    return append3(float_to_string(value2), "ex");
  } else if (size instanceof Ic) {
    let value2 = size[0];
    return append3(float_to_string(value2), "ic");
  } else if (size instanceof In) {
    let value2 = size[0];
    return append3(float_to_string(value2), "in");
  } else if (size instanceof Mm) {
    let value2 = size[0];
    return append3(float_to_string(value2), "mm");
  } else if (size instanceof Pc) {
    let value2 = size[0];
    return append3(float_to_string(value2), "pc");
  } else if (size instanceof Q) {
    let value2 = size[0];
    return append3(float_to_string(value2), "q");
  } else if (size instanceof Rcap) {
    let value2 = size[0];
    return append3(float_to_string(value2), "rcap");
  } else if (size instanceof Rch) {
    let value2 = size[0];
    return append3(float_to_string(value2), "rch");
  } else if (size instanceof Rex) {
    let value2 = size[0];
    return append3(float_to_string(value2), "rex");
  } else if (size instanceof Ric) {
    let value2 = size[0];
    return append3(float_to_string(value2), "ric");
  } else if (size instanceof Vb) {
    let value2 = size[0];
    return append3(float_to_string(value2), "vb");
  } else if (size instanceof Vi) {
    let value2 = size[0];
    return append3(float_to_string(value2), "vi");
  } else if (size instanceof Vmax) {
    let value2 = size[0];
    return append3(float_to_string(value2), "vmax");
  } else {
    let value2 = size[0];
    return append3(float_to_string(value2), "vmin");
  }
}

// build/dev/javascript/sketch/sketch/css.mjs
function class$4(styles) {
  return class$2(styles);
}
function property2(field4, content) {
  return new Property(field4, content, false);
}
function background(background2) {
  return property2("background", background2);
}
function padding(padding2) {
  return property2("padding", to_string3(padding2));
}

// build/dev/javascript/sketch/sketch.mjs
var StyleSheet = class extends CustomType {
  constructor(cache, is_persistent) {
    super();
    this.cache = cache;
    this.is_persistent = is_persistent;
  }
};
var Ephemeral = class extends CustomType {
};
function render(cache) {
  return render_sheet(cache.cache);
}
function class_name2(class$5, stylesheet2) {
  let $ = class_name(class$5, stylesheet2.cache);
  let cache = $[0];
  let class_name$1 = $[1];
  return [
    (() => {
      let _record = stylesheet2;
      return new StyleSheet(cache, _record.is_persistent);
    })(),
    class_name$1
  ];
}
function stylesheet(strategy) {
  return new Ok(
    (() => {
      if (strategy instanceof Ephemeral) {
        return new StyleSheet(new$4(), false);
      } else {
        return new StyleSheet(new$4(), true);
      }
    })()
  );
}

// build/dev/javascript/gleam_stdlib/gleam/function.mjs
function tap2(arg, effect) {
  effect(arg);
  return arg;
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text2(content) {
  return text(content);
}
function style2(attrs, css) {
  return element("style", attrs, toList([text2(css)]));
}

// build/dev/javascript/sketch_lustre/sketch/lustre/element.mjs
var Nothing = class extends CustomType {
};
var Text2 = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Map3 = class extends CustomType {
  constructor(subtree) {
    super();
    this.subtree = subtree;
  }
};
var Element3 = class extends CustomType {
  constructor(key3, namespace, tag, class$5, attributes, children2) {
    super();
    this.key = key3;
    this.namespace = namespace;
    this.tag = tag;
    this.class = class$5;
    this.attributes = attributes;
    this.children = children2;
  }
};
function none3() {
  return new Nothing();
}
function text3(content) {
  return new Text2(content);
}
function element2(tag, class$5, attributes, children2) {
  let class$1 = new Some(class$5);
  return new Element3("", "", tag, class$1, attributes, children2);
}
function do_keyed(element3, key3) {
  if (element3 instanceof Nothing) {
    return new Nothing();
  } else if (element3 instanceof Text2) {
    let content = element3.content;
    return new Text2(content);
  } else if (element3 instanceof Map3) {
    let subtree = element3.subtree;
    return new Map3(() => {
      return do_keyed(subtree(), key3);
    });
  } else {
    let namespace = element3.namespace;
    let tag = element3.tag;
    let attributes = element3.class;
    let children2 = element3.attributes;
    let styles = element3.children;
    return new Element3(key3, namespace, tag, attributes, children2, styles);
  }
}
function keyed(element3, children2) {
  return element3(
    map2(
      children2,
      (_use0) => {
        let key3 = _use0[0];
        let child = _use0[1];
        return do_keyed(child, key3);
      }
    )
  );
}
function unstyled_children(stylesheet2, children2) {
  return fold(
    reverse(children2),
    [stylesheet2, toList([])],
    (acc, child) => {
      let stylesheet$1 = acc[0];
      let children$1 = acc[1];
      let $ = unstyled(stylesheet$1, child);
      let stylesheet$2 = $[0];
      let child$1 = $[1];
      return [stylesheet$2, prepend(child$1, children$1)];
    }
  );
}
function unstyled(loop$stylesheet, loop$element) {
  while (true) {
    let stylesheet2 = loop$stylesheet;
    let element3 = loop$element;
    if (element3 instanceof Nothing) {
      return [stylesheet2, none2()];
    } else if (element3 instanceof Text2) {
      let content = element3.content;
      return [stylesheet2, text(content)];
    } else if (element3 instanceof Map3) {
      let subtree = element3.subtree;
      loop$stylesheet = stylesheet2;
      loop$element = subtree();
    } else {
      let key3 = element3.key;
      let namespace = element3.namespace;
      let tag = element3.tag;
      let class$5 = element3.class;
      let attributes = element3.attributes;
      let children2 = element3.children;
      let class$1 = map(
        class$5,
        (_capture) => {
          return class_name2(_capture, stylesheet2);
        }
      );
      let class_name3 = map(class$1, second);
      let stylesheet$1 = (() => {
        let _pipe = map(class$1, first);
        return unwrap(_pipe, stylesheet2);
      })();
      let $ = unstyled_children(stylesheet$1, children2);
      let stylesheet$2 = $[0];
      let children$1 = $[1];
      let attributes$1 = (() => {
        if (class_name3 instanceof None) {
          return attributes;
        } else {
          let class_name$1 = class_name3[0];
          let class_name$2 = class$(class_name$1);
          return prepend(class_name$2, attributes);
        }
      })();
      return [
        stylesheet$2,
        (() => {
          let $1 = element(tag, attributes$1, children$1);
          if ($1 instanceof Element2) {
            let t = $1.tag;
            let a = $1.attrs;
            let c = $1.children;
            let s = $1.self_closing;
            let v = $1.void;
            return new Element2(key3, namespace, t, a, c, s, v);
          } else {
            let e = $1;
            return e;
          }
        })()
      ];
    }
  }
}

// build/dev/javascript/sketch_lustre/css-stylesheet.ffi.mjs
function replaceSync(content, stylesheet2) {
  stylesheet2.replaceSync(content);
}

// build/dev/javascript/sketch_lustre/mutable.ffi.mjs
function wrap(current) {
  if (isPersistent(current))
    return { current };
  return current;
}
function set(variable, newValue) {
  if (!("current" in variable))
    return newValue;
  variable.current = newValue;
  return variable;
}
function get(variable) {
  if ("current" in variable)
    return variable.current;
  return variable;
}
function isPersistent(cache) {
  return "cache" in cache && "is_persistent" in cache && cache.is_persistent;
}

// build/dev/javascript/sketch_lustre/sketch/lustre.mjs
var Document2 = class extends CustomType {
  constructor(css_stylesheet) {
    super();
    this.css_stylesheet = css_stylesheet;
  }
};
var Node2 = class extends CustomType {
};
function render2(stylesheet2, outputs, view2) {
  let stylesheet$1 = wrap(stylesheet2);
  let new_view = view2();
  let $ = unstyled(get(stylesheet$1), new_view);
  let st = $[0];
  let new_view$1 = $[1];
  let content = render(st);
  set(stylesheet$1, st);
  return fold(
    outputs,
    new_view$1,
    (view3, stylesheet3) => {
      if (stylesheet3 instanceof Node2) {
        let style3 = style2(toList([]), content);
        if (view3 instanceof Element2 && view3.tag === "lustre-fragment") {
          return fragment(prepend(style3, view3.children));
        } else {
          let view$1 = view3;
          return fragment(toList([style3, view$1]));
        }
      } else if (stylesheet3 instanceof Document2) {
        let css_stylesheet = stylesheet3.css_stylesheet;
        return tap2(
          view3,
          (_) => {
            return replaceSync(content, css_stylesheet);
          }
        );
      } else {
        let css_stylesheet = stylesheet3.css_stylesheet;
        return tap2(
          view3,
          (_) => {
            return replaceSync(content, css_stylesheet);
          }
        );
      }
    }
  );
}
function node() {
  return new Node2();
}

// build/dev/javascript/sketch_lustre/sketch/lustre/element/html.mjs
function text4(content) {
  return text3(content);
}
function button(class$5, attributes, children2) {
  return element2("button", class$5, attributes, children2);
}
function div(class$5, attributes, children2) {
  return element2("div", class$5, attributes, children2);
}
function img(class$5, attributes) {
  return element2("img", class$5, attributes, toList([]));
}

// build/dev/javascript/litebug_gleam/cats.mjs
var Cat = class extends CustomType {
  constructor(id, url) {
    super();
    this.id = id;
    this.url = url;
  }
};
function decode_cat(json) {
  let decoder = field(
    "id",
    string3,
    (id) => {
      return field(
        "url",
        string3,
        (url) => {
          return success(new Cat(id, url));
        }
      );
    }
  );
  let _pipe = run(json, list2(decoder));
  let _pipe$1 = map_error(
    _pipe,
    (_) => {
      return "Error decoding cat";
    }
  );
  let _pipe$2 = map3(
    _pipe$1,
    (cats) => {
      let _pipe$22 = cats;
      let _pipe$3 = first2(_pipe$22);
      return replace_error(_pipe$3, "No cats in list");
    }
  );
  return flatten2(_pipe$2);
}
function get_cat_promise(_) {
  let $ = get_random_string(32);
  let $1 = hash2("test");
  let $2 = to("https://api.thecatapi.com/v1/images/search");
  if (!$2.isOk()) {
    throw makeError(
      "let_assert",
      "cats",
      34,
      "get_cat_promise",
      "Pattern match failed, no pattern matched the value.",
      { value: $2 }
    );
  }
  let req = $2[0];
  let _pipe = req;
  let _pipe$1 = send(_pipe);
  let _pipe$2 = try_await(_pipe$1, read_json_body);
  let _pipe$3 = map_promise(
    _pipe$2,
    (res) => {
      if (res.isOk() && res[0] instanceof Response) {
        let body2 = res[0].body;
        return decode_cat(body2);
      } else {
        return new Error("Error fetching cat");
      }
    }
  );
  return rescue(
    _pipe$3,
    (_2) => {
      return new Error("Error fetching cat");
    }
  );
}

// build/dev/javascript/litebug_gleam/components/button.mjs
var Success = class extends CustomType {
};
var Warn = class extends CustomType {
};
var Danger = class extends CustomType {
};
var Default = class extends CustomType {
};
function button2(label, variant, on_click2) {
  let bg_color = (() => {
    if (variant instanceof Success) {
      return "green";
    } else if (variant instanceof Warn) {
      return "yellow";
    } else if (variant instanceof Danger) {
      return "red";
    } else {
      return "blue";
    }
  })();
  let class$5 = class$4(
    toList([background(bg_color), padding(px(10))])
  );
  return button(
    class$5,
    (() => {
      if (on_click2 instanceof Some) {
        let on_click$1 = on_click2[0];
        return toList([on_click$1]);
      } else {
        return toList([]);
      }
    })(),
    toList([text3(label)])
  );
}

// build/dev/javascript/litebug_gleam/litebug_gleam.mjs
var Model2 = class extends CustomType {
  constructor(count, cats, fetching, oauth_config, token_response) {
    super();
    this.count = count;
    this.cats = cats;
    this.fetching = fetching;
    this.oauth_config = oauth_config;
    this.token_response = token_response;
  }
};
var Login = class extends CustomType {
};
var LoggedInSuccessfully = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Logout = class extends CustomType {
};
var LoggedOut = class extends CustomType {
};
var Increment = class extends CustomType {
};
var Decrement = class extends CustomType {
};
var ApiReturnedCat = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var FetchingCats = class extends CustomType {
};
var FetchResult = class extends CustomType {
  constructor(data, error, loading) {
    super();
    this.data = data;
    this.error = error;
    this.loading = loading;
  }
};
function load_token() {
  return from(
    (dispatch) => {
      let $ = try$(
        localStorage(),
        (local_storage) => {
          return try$(
            getItem(local_storage, "auth_token"),
            (token) => {
              echo2("Loaded token", "src/litebug_gleam.gleam", 73);
              echo2(token, "src/litebug_gleam.gleam", 74);
              return try$(
                (() => {
                  let _pipe = parse(
                    token,
                    token_resp_decoder()
                  );
                  return map_error(
                    _pipe,
                    (error) => {
                      echo2(error, "src/litebug_gleam.gleam", 78);
                      return void 0;
                    }
                  );
                })(),
                (token2) => {
                  echo2("Dispatching", "src/litebug_gleam.gleam", 82);
                  dispatch(new LoggedInSuccessfully(token2));
                  return new Ok(void 0);
                }
              );
            }
          );
        }
      );
      return void 0;
    }
  );
}
function init2(_) {
  let config = new OAuth2ClientConfig(
    "54",
    "https://firefly.andho.xyz/oauth/authorize",
    "https://firefly.andho.xyz/oauth/token",
    "http://localhost:1234/oauth/handle",
    ""
  );
  return [
    new Model2(0, toList([]), false, config, new None()),
    batch(toList([load_token()]))
  ];
}
function login(config) {
  return from(
    (_) => {
      let _pipe = create_authorization_request_url(config);
      map_try(
        _pipe,
        (authorize_url) => {
          let curr_window = self();
          let $ = (() => {
            let _pipe$1 = localStorage();
            return map3(
              _pipe$1,
              (_capture) => {
                return setItem(
                  _capture,
                  "glebs_verifier",
                  authorize_url[1]
                );
              }
            );
          })();
          echo2(authorize_url, "src/litebug_gleam.gleam", 201);
          let curr_window$1 = self();
          setLocation(curr_window$1, to_string2(authorize_url[0]));
          return new Ok(void 0);
        }
      );
      return void 0;
    }
  );
}
function redirect_to_home() {
  let curr_window = self();
  return none();
}
function logout() {
  return from(
    (dispatch) => {
      let $ = (() => {
        let _pipe = localStorage();
        return map3(
          _pipe,
          (_capture) => {
            return removeItem(_capture, "auth_token");
          }
        );
      })();
      dispatch(new LoggedOut());
      return void 0;
    }
  );
}
function login_view(model, stylesheet2) {
  return render2(
    stylesheet2,
    toList([node()]),
    () => {
      let count = to_string(model.count);
      return div(
        class$4(toList([])),
        toList([]),
        toList([
          div(
            class$4(toList([])),
            toList([]),
            toList([
              button2(
                "Login",
                new Default(),
                new Some(on_click(new Login()))
              )
            ])
          ),
          button(
            class$4(toList([])),
            toList([on_click(new Decrement())]),
            toList([text3("Decrement")])
          ),
          text4(count),
          button(
            class$4(toList([])),
            toList([on_click(new Increment())]),
            toList([text3("Increment")])
          ),
          (() => {
            let $ = model.fetching;
            if ($) {
              return text3("Fetching cats...");
            } else {
              return none3();
            }
          })(),
          keyed(
            (_capture) => {
              return div(class$4(toList([])), toList([]), _capture);
            },
            map2(
              model.cats,
              (cat) => {
                return [
                  cat.id,
                  img(
                    class$4(toList([])),
                    toList([
                      src(cat.url),
                      width(400),
                      height(400)
                    ])
                  )
                ];
              }
            )
          )
        ])
      );
    }
  );
}
function home_view(model, stylesheet2) {
  return render2(
    stylesheet2,
    toList([node()]),
    () => {
      let count = to_string(model.count);
      return div(
        class$4(toList([])),
        toList([]),
        toList([
          div(
            class$4(toList([])),
            toList([]),
            toList([
              button2(
                "Logout",
                new Default(),
                new Some(on_click(new Logout()))
              )
            ])
          ),
          button(
            class$4(toList([])),
            toList([on_click(new Decrement())]),
            toList([text3("Decrement")])
          ),
          text4(count),
          button(
            class$4(toList([])),
            toList([on_click(new Increment())]),
            toList([text3("Increment")])
          ),
          (() => {
            let $ = model.fetching;
            if ($) {
              return text3("Fetching cats...");
            } else {
              return none3();
            }
          })(),
          keyed(
            (_capture) => {
              return div(class$4(toList([])), toList([]), _capture);
            },
            map2(
              model.cats,
              (cat) => {
                return [
                  cat.id,
                  img(
                    class$4(toList([])),
                    toList([
                      src(cat.url),
                      width(400),
                      height(400)
                    ])
                  )
                ];
              }
            )
          )
        ])
      );
    }
  );
}
function view(model, stylesheet2) {
  let $ = model.token_response;
  if ($ instanceof Some) {
    return home_view(model, stylesheet2);
  } else {
    return login_view(model, stylesheet2);
  }
}
function swr(key3, fetcher, wrap_effect) {
  return from(
    (dispatch) => {
      let _pipe = new FetchResult(new None(), new None(), true);
      let _pipe$1 = wrap_effect(_pipe);
      dispatch(_pipe$1);
      let _pipe$2 = fetcher(key3);
      let _pipe$3 = map_promise(
        _pipe$2,
        (p) => {
          if (p.isOk()) {
            let data = p[0];
            return new FetchResult(
              new Some(data),
              new None(),
              false
            );
          } else {
            let error = p[0];
            return new FetchResult(
              new None(),
              new Some(error),
              false
            );
          }
        }
      );
      let _pipe$4 = map_promise(_pipe$3, wrap_effect);
      tap(_pipe$4, dispatch);
      return void 0;
    }
  );
}
function get_cat() {
  return swr(
    void 0,
    get_cat_promise,
    (result) => {
      if (result instanceof FetchResult && result.data instanceof Some) {
        let cat = result.data[0];
        return new ApiReturnedCat(new Ok(cat));
      } else if (result instanceof FetchResult && result.error instanceof Some) {
        let error = result.error[0];
        return new ApiReturnedCat(new Error(error));
      } else if (result instanceof FetchResult && result.loading) {
        return new FetchingCats();
      } else {
        return new ApiReturnedCat(new Error("No cat"));
      }
    }
  );
}
function update(model, msg) {
  if (msg instanceof Login) {
    return [model, login(model.oauth_config)];
  } else if (msg instanceof LoggedInSuccessfully) {
    let token = msg[0];
    echo2("Logged in successfully", "src/litebug_gleam.gleam", 233);
    return [
      (() => {
        let _record = model;
        return new Model2(
          _record.count,
          _record.cats,
          _record.fetching,
          _record.oauth_config,
          new Some(token)
        );
      })(),
      redirect_to_home()
    ];
  } else if (msg instanceof Logout) {
    return [model, logout()];
  } else if (msg instanceof LoggedOut) {
    return [
      (() => {
        let _record = model;
        return new Model2(
          _record.count,
          _record.cats,
          _record.fetching,
          _record.oauth_config,
          new None()
        );
      })(),
      none()
    ];
  } else if (msg instanceof Increment) {
    return [
      (() => {
        let _record = model;
        return new Model2(
          model.count + 1,
          _record.cats,
          _record.fetching,
          _record.oauth_config,
          _record.token_response
        );
      })(),
      get_cat()
    ];
  } else if (msg instanceof Decrement) {
    return [
      (() => {
        let _record = model;
        return new Model2(
          model.count - 1,
          _record.cats,
          _record.fetching,
          _record.oauth_config,
          _record.token_response
        );
      })(),
      none()
    ];
  } else if (msg instanceof ApiReturnedCat && msg[0].isOk()) {
    let cat = msg[0][0];
    echo2(cat, "src/litebug_gleam.gleam", 241);
    return [
      (() => {
        let _record = model;
        return new Model2(
          _record.count,
          prepend(cat, model.cats),
          false,
          _record.oauth_config,
          _record.token_response
        );
      })(),
      none()
    ];
  } else if (msg instanceof ApiReturnedCat && !msg[0].isOk()) {
    let error = msg[0][0];
    echo2(error, "src/litebug_gleam.gleam", 248);
    return [
      (() => {
        let _record = model;
        return new Model2(
          _record.count,
          _record.cats,
          false,
          _record.oauth_config,
          _record.token_response
        );
      })(),
      none()
    ];
  } else {
    return [
      (() => {
        let _record = model;
        return new Model2(
          _record.count,
          _record.cats,
          true,
          _record.oauth_config,
          _record.token_response
        );
      })(),
      none()
    ];
  }
}
function main() {
  let $ = stylesheet(new Ephemeral());
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "litebug_gleam",
      37,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let stylesheet2 = $[0];
  let app = application(
    init2,
    update,
    (_capture) => {
      return view(_capture, stylesheet2);
    }
  );
  let $1 = start2(app, "#app", void 0);
  if (!$1.isOk()) {
    throw makeError(
      "let_assert",
      "litebug_gleam",
      39,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $1 }
    );
  }
  return void 0;
}
function echo2(value2, file, line) {
  const grey = "\x1B[90m";
  const reset_color = "\x1B[39m";
  const file_line = `${file}:${line}`;
  const string_value = echo$inspect2(value2);
  if (typeof process === "object" && process.stderr?.write) {
    const string7 = `${grey}${file_line}${reset_color}
${string_value}
`;
    process.stderr.write(string7);
  } else if (typeof Deno === "object") {
    const string7 = `${grey}${file_line}${reset_color}
${string_value}
`;
    Deno.stderr.writeSync(new TextEncoder().encode(string7));
  } else {
    const string7 = `${file_line}
${string_value}`;
    console.log(string7);
  }
  return value2;
}
function echo$inspectString2(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    if (char == "\n")
      new_str += "\\n";
    else if (char == "\r")
      new_str += "\\r";
    else if (char == "	")
      new_str += "\\t";
    else if (char == "\f")
      new_str += "\\f";
    else if (char == "\\")
      new_str += "\\\\";
    else if (char == '"')
      new_str += '\\"';
    else if (char < " " || char > "~" && char < "\xA0") {
      new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
    } else {
      new_str += char;
    }
  }
  new_str += '"';
  return new_str;
}
function echo$inspectDict2(map7) {
  let body2 = "dict.from_list([";
  let first4 = true;
  let key_value_pairs = [];
  map7.forEach((value2, key3) => {
    key_value_pairs.push([key3, value2]);
  });
  key_value_pairs.sort();
  key_value_pairs.forEach(([key3, value2]) => {
    if (!first4)
      body2 = body2 + ", ";
    body2 = body2 + "#(" + echo$inspect2(key3) + ", " + echo$inspect2(value2) + ")";
    first4 = false;
  });
  return body2 + "])";
}
function echo$inspectCustomType2(record) {
  const props = Object.keys(record).map((label) => {
    const value2 = echo$inspect2(record[label]);
    return isNaN(parseInt(label)) ? `${label}: ${value2}` : value2;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function echo$inspectObject2(v) {
  const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${echo$inspect2(k)}: ${echo$inspect2(v[k])}`);
  }
  const body2 = props.length ? " " + props.join(", ") + " " : "";
  const head = name === "Object" ? "" : name + " ";
  return `//js(${head}{${body2}})`;
}
function echo$inspect2(v) {
  const t = typeof v;
  if (v === true)
    return "True";
  if (v === false)
    return "False";
  if (v === null)
    return "//js(null)";
  if (v === void 0)
    return "Nil";
  if (t === "string")
    return echo$inspectString2(v);
  if (t === "bigint" || t === "number")
    return v.toString();
  if (Array.isArray(v))
    return `#(${v.map(echo$inspect2).join(", ")})`;
  if (v instanceof List)
    return `[${v.toArray().map(echo$inspect2).join(", ")}]`;
  if (v instanceof UtfCodepoint)
    return `//utfcodepoint(${String.fromCodePoint(v.value)})`;
  if (v instanceof BitArray)
    return echo$inspectBitArray2(v);
  if (v instanceof CustomType)
    return echo$inspectCustomType2(v);
  if (echo$isDict2(v))
    return echo$inspectDict2(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(echo$inspect2).join(", ")}))`;
  if (v instanceof RegExp)
    return `//js(${v})`;
  if (v instanceof Date)
    return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return echo$inspectObject2(v);
}
function echo$inspectBitArray2(bitArray) {
  let endOfAlignedBytes = bitArray.bitOffset + 8 * Math.trunc(bitArray.bitSize / 8);
  let alignedBytes = bitArraySlice(bitArray, bitArray.bitOffset, endOfAlignedBytes);
  let remainingUnalignedBits = bitArray.bitSize % 8;
  if (remainingUnalignedBits > 0) {
    let remainingBits = bitArraySliceToInt(bitArray, endOfAlignedBytes, bitArray.bitSize, false, false);
    let alignedBytesArray = Array.from(alignedBytes.rawBuffer);
    let suffix = `${remainingBits}:size(${remainingUnalignedBits})`;
    if (alignedBytesArray.length === 0) {
      return `<<${suffix}>>`;
    } else {
      return `<<${Array.from(alignedBytes.rawBuffer).join(", ")}, ${suffix}>>`;
    }
  } else {
    return `<<${Array.from(alignedBytes.rawBuffer).join(", ")}>>`;
  }
}
function echo$isDict2(value2) {
  try {
    return value2 instanceof Dict;
  } catch {
    return false;
  }
}

// build/.lustre/entry.mjs
main();
