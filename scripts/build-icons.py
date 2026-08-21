"""依存なしでアイコンPNGを書き出す。macOSにSVGラスタライザが無い前提で、画素を直接置く。"""
import zlib, struct

BG    = (0x1c, 0x1a, 0x17)
SPINE = [(0xb4, 0x64, 0x2a), (0xd9, 0x8f, 0x4f), (0xe8, 0xdf, 0xd2)]

def rounded(size, radius, x, y):
    for cx, cy in ((radius, radius), (size-1-radius, radius),
                   (radius, size-1-radius), (size-1-radius, size-1-radius)):
        if (x < radius or x > size-1-radius) and (y < radius or y > size-1-radius):
            if (x-cx)**2 + (y-cy)**2 > radius**2:
                return False
    return True

def draw(size):
    r = int(size * 0.22)
    m = size * 0.18          # 余白
    w = (size - 2*m) / 3.4   # 背表紙の幅
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            px = BG
            for i in range(3):
                left = m + i * w * 1.12
                top = m + (size*0.05 if i == 1 else 0)
                if left <= x < left + w and top <= y < size - m:
                    px = SPINE[i]
            a = 255 if rounded(size, r, x, y) else 0
            row += bytes((*px, a))
        rows.append(bytes([0]) + bytes(row))
    return b''.join(rows)

def png(path, size):
    raw = draw(size)
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c))
    out = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(raw, 9))
           + chunk(b'IEND', b''))
    open(path, 'wb').write(out)
    print(f'{path} {size}x{size} {len(out)}B')

png('icon-180.png', 180)
png('icon-512.png', 512)
