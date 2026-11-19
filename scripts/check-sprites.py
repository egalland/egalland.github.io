from pathlib import Path
from PIL import Image, ImageChops, ImageStat

for name, rows in [('factory', 4), ('world', 4), ('actors', 5)]:
    image = Image.open(Path('public/art') / ('animated-' + name + '.webp'))
    assert image.mode == 'RGBA', name + ' needs alpha'
    assert image.getpixel((0, 0))[3] == 0, name + ' has a painted backdrop'
    for row in range(rows):
        frames = [image.crop((round(i * image.width / 4), round(row * image.height / rows), round((i + 1) * image.width / 4), round((row + 1) * image.height / rows))).resize((128, 128)) for i in range(4)]
        for frame in frames:
            assert frame.getchannel('A').getextrema() == (0, 255), (name, row)
        for frame in frames[1:]:
            assert sum(ImageStat.Stat(ImageChops.difference(frames[0], frame)).mean) > 10, (name, row, 'identical poses')
    print('PASS', name, rows * 4, 'distinct transparent animation frames')

for name in ['drill', 'furnace', 'press', 'wiremill', 'assembler', 'city', 'depot', 'buildings']:
    image = Image.open(Path('public/art') / ('detail-' + name + '.webp'))
    assert image.mode == 'RGBA' and image.getpixel((0, 0))[3] == 0, name + ' needs transparency'
    assert image.width >= 1200 and image.height >= 1200, name + ' needs close-up detail'
    columns = 1 if name in ['city', 'depot'] else 2
    frames = [image.crop((int(x * image.width / columns), int(y * image.height / columns), int((x + 1) * image.width / columns), int((y + 1) * image.height / columns))) for y in range(columns) for x in range(columns)]
    for frame in frames:
        assert frame.getchannel('A').getextrema() == (0, 255), name + ' has an opaque cell'
    for frame in frames[1:]:
        assert sum(ImageStat.Stat(ImageChops.difference(frames[0], frame)).mean) > 1, name + ' has identical cells'
    print('PASS', name, 'transparent detailed cells; static buildings have one pose')

for name in ['worker', 'truck']:
    image = Image.open(Path('public/art') / ('wool-' + name + '-directions.webp'))
    assert image.mode == 'RGBA' and image.getpixel((0, 0))[3] <= 1
    assert image.width >= 1600 and image.height >= 800
    for col in range(8):
        poses = [image.crop((round(col * image.width / 8), round(row * image.height / 4), round((col + 1) * image.width / 8), round((row + 1) * image.height / 4))).resize((128, 128)) for row in range(4)]
        assert all(p.getchannel('A').getextrema()[0] == 0 and p.getchannel('A').getextrema()[1] >= 250 for p in poses)  # resampling can lower 255 to 254
        assert any(sum(ImageStat.Stat(ImageChops.difference(poses[0], p)).mean) > 1 for p in poses[1:]), (name, col, 'no motion poses')
    print('PASS', name, 'eight directions and four transparent animation poses per direction')

# These are the exact atlases sampled by the terrain and particle renderer.
for name, cols, rows in [('terrain-landforms',2,2),('terrain-scenery',3,2),('activity-effects',4,3),('guard-directions',4,4)]:
    image=Image.open(Path('public/art') / (name+'.webp'))
    assert image.mode=='RGBA' and image.width%cols==0 and image.height%rows==0, name
    w,h=image.width//cols,image.height//rows
    cells=[]
    for row in range(rows):
        for col in range(cols):
            tile=image.crop((col*w,row*h,(col+1)*w,(row+1)*h)).resize((96,96))
            assert tile.getchannel('A').getextrema()[0]<5 and tile.getchannel('A').getextrema()[1]>160,(name,row,col)
            cells.append(tile)
    checks=[(i,i+8) for i in range(8)] if name=='guard-directions' else [(i,i+1) for i in range(cols*rows-1) if (i+1)%cols]
    for a,b in checks:
        assert sum(ImageStat.Stat(ImageChops.difference(cells[a],cells[b])).mean)>4,(name,a,b)
    print('PASS',name,len(cells),'individual transparent sprite cells')
faces=[Image.open(Path('public/art')/('surface-'+f+'.webp')).convert('RGB') for f in ['top','bottom','north','south','east','west']]
assert all(im.size==(768,768) and min(ImageStat.Stat(im).stddev)>9 for im in faces)
assert len({im.resize((12,12)).tobytes() for im in faces})==6
print('PASS Six distinct relief maps with visible tonal variation')

for name,columns,rows in [('cargo-goods',3,3),('carrier-directions',8,4)]:
    im=Image.open(Path('public/art')/(name+'.webp'))
    assert im.mode=='RGBA' and im.width%columns==0 and im.height%rows==0
    w,h=im.width//columns,im.height//rows
    cells=[im.crop((x*w,y*h,(x+1)*w,(y+1)*h)).resize((96,96)) for y in range(rows) for x in range(columns)]
    for cell in cells:
        alpha=cell.getchannel('A')
        assert alpha.getextrema()[0]<4 and alpha.getextrema()[1]>240,(name,'missing silhouette')
    for i,cell in enumerate(cells):
        compare=cells[(i+8)%32] if name=='carrier-directions' else cells[(i+1)%9]
        assert sum(ImageStat.Stat(ImageChops.difference(cell,compare)).mean)>3,(name,i,'identical cargo/pose')
    print('PASS',name,len(cells),'distinct transparent cargo or loaded-walk cells')
