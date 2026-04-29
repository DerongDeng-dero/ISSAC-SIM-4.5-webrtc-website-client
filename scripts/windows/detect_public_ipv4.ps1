$candidates = @()

Get-NetIPConfiguration | ForEach-Object {
    $config = $_

    if (-not $config.IPv4Address -or -not $config.IPv4DefaultGateway) {
        return
    }

    $adapter = Get-NetAdapter -InterfaceIndex $config.InterfaceIndex -ErrorAction SilentlyContinue
    if (-not $adapter -or $adapter.Status -ne "Up") {
        return
    }

    $label = ("{0} {1}" -f $config.InterfaceAlias, $config.InterfaceDescription).ToLowerInvariant()

    foreach ($address in $config.IPv4Address) {
        $ip = $address.IPAddress
        if (-not $ip) {
            continue
        }

        if ($ip -match '^127\.') {
            continue
        }

        if ($ip -match '^169\.254\.') {
            continue
        }

        if ($ip -match '^198\.(18|19)\.') {
            continue
        }

        $score = 0

        if ($label -match 'ethernet|wi-?fi|wlan|wireless') {
            $score += 200
        }

        if ($label -match 'meta|tunnel|virtual|hyper-v|loopback|vpn|tap|tun|wintun|tailscale|zerotier') {
            $score -= 1000
        }

        if ($config.IPv4DefaultGateway.NextHop) {
            $score += 50
        }

        if ($adapter.LinkSpeed -and $adapter.LinkSpeed -notmatch '^0') {
            $score += 10
        }

        $candidates += [PSCustomObject]@{
            IPAddress            = $ip
            InterfaceAlias       = $config.InterfaceAlias
            InterfaceDescription = $config.InterfaceDescription
            Score                = $score
        }
    }
}

$selected = $candidates |
    Sort-Object @{ Expression = "Score"; Descending = $true }, InterfaceAlias |
    Select-Object -First 1

if ($selected) {
    $selected.IPAddress
}
