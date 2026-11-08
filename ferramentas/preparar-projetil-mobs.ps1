param([Parameter(Mandatory=$true)][string]$Pacote)
# A folha original do ZIP só contém o frame 0; os oito PNGs individuais estão corretos.
Add-Type -AssemblyName System.Drawing
$temp=Join-Path ([IO.Path]::GetTempPath()) ('dbi-projetil-'+[guid]::NewGuid())
Expand-Archive -LiteralPath $Pacote -DestinationPath $temp
$destino=Join-Path $PSScriptRoot '../public/assets/mobs/projetil-ki'
New-Item -ItemType Directory -Path $destino -Force | Out-Null
$atlas=New-Object Drawing.Bitmap 2304,256
$g=[Drawing.Graphics]::FromImage($atlas)
for($i=0;$i -lt 8;$i++){
 $arquivo=Join-Path $temp ('frames/frame_{0:00}.png' -f $i)
 $frame=[Drawing.Bitmap]::FromFile($arquivo)
 if($frame.Width -ne 288 -or $frame.Height -ne 256){throw "Dimensões inválidas: $arquivo"}
 $g.DrawImageUnscaled($frame,$i*288,0);$frame.Dispose()
}
$atlas.Save((Join-Path $destino 'spritesheet.png'),[Drawing.Imaging.ImageFormat]::Png)
$g.Dispose();$atlas.Dispose()
