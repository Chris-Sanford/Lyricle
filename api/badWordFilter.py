'''
What I ended up doing for now since we don't have a paid API account for this service 
is I went to the web GUI to test the API:

https://www.neutrinoapi.com/account/tools/?api=bad-word-filter

And pasted the JSON of the song lyrics which gave me the list of the bad words in the lyrics.
Then I just found and replaced the content in the JSON manually.
This is okay for now since we're doing the songs in batches.

Also as a side note, I think what happens with the BWF API is if you send it too much content
it won't give you a complete repeat of the censored content so we might
have to just receive the bad words in response and then do the censoring ourselves.
Also it doesn't seem to properly interpret the \\n in the JSON so we might have to do that ourselves as well.

For now, I'm keeping this code here just for reference.
'''

import requests
import json

lyrics = '''[Intro]
Ayy

[Verse 1]
I'm tryna put you in the worst mood, ah
P1 cleaner than your church shoes, ah
Milli point two just to hurt you, ah
All red Lamb' just to tease you, ah
None of these toys on lease too, ah
Made your whole year in a week too, yah
Main bitch outta your league too, ah
Side bitch outta your league too, ah

[Pre-Chorus]
House so empty, need a centerpiece
Twenty racks a table, cut from ebony
Cut that ivory into skinny pieces
Then she clean it with her face, man, I love my baby, ah
You talkin' money, need a hearin' aid
You talkin' 'bout me, I don't see the shade
Switch up my style, I take any lane
I switch up my cup, I kill any pain

[Chorus]
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
Look what you've done
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
I'm a motherfuckin' starboy
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
Look what you've done
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
I'm a motherfuckin' starboy

[Verse 2]
Every day, a nigga try to test me, ah
Every day, a nigga try to end me, ah
Pull off in that Roadster SV, ah
Pockets overweight, gettin' hefty, ah
Comin' for the king, that's a far cry, I
I come alive in the fall time, I
The competition, I don't really listen
I'm in the blue Mulsanne, bumpin' New Edition

[Pre-Chorus]
House so empty, need a centerpiece
Twenty racks a table, cut from ebony
Cut that ivory into skinny pieces
Then she clean it with her face, man, I love my baby, ah
You talkin' money, need a hearin' aid
You talkin' 'bout me, I don't see the shade
Switch up my style, I take any lane
I switch up my cup, I kill any pain

[Chorus]
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
Look what you've done
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
I'm a motherfuckin' starboy
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
Look what you've done
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
I'm a motherfuckin' starboy

[Verse 3]
Let a nigga brag Pitt
Legend of the fall, took the year like a bandit
Bought Mama a crib and a brand new wagon
Now she hit the grocery shop lookin' lavish
Star Trek roof in that Wraith of Khan
Girls get loose when they hear this song
A hundred on the dash get me close to God
We don't pray for love, we just pray for cars

[Pre-Chorus]
House so empty, need a centerpiece
Twenty racks a table, cut from ebony
Cut that ivory into skinny pieces
Then she clean it with her face, man, I love my baby, ah
You talkin' money, need a hearin' aid
You talkin' 'bout me, I don't see the shade
Switch up my style, I take any lane
I switch up my cup, I kill any pain

[Chorus]
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
Look what you've done
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
I'm a motherfuckin' starboy
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
Look what you've done
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
I'm a motherfuckin' starboy
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
Look what you've done
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
I'm a motherfuckin' starboy
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
Look what you've done
(Ha-ha-ha-ha-ha, ha-ha-ha-ha-ha)
I'm a motherfuckin' starboy
'''

# UPDATE THIS URL TO BE OUR OWN
url = "https://neutrinoapi-bad-word-filter.p.rapidapi.com/bad-word-filter"

payload = {
	"content": lyrics,
	"censor-character": "*"
}

headers = {
	"content-type": "application/x-www-form-urlencoded",
	"X-RapidAPI-Key": "bb05e3d2a2msh81f645697cd2e4bp1c908djsn91a00f4f4373", # CHANGE THIS TO OURS
	"X-RapidAPI-Host": "neutrinoapi-bad-word-filter.p.rapidapi.com" # THIS TOO
}

response = requests.post(url, data=payload, headers=headers)

print("\n\nresponse.json()")
print(response.json())

print("\n\nresponse.text")
print(response.text)

print("\n\nresponse.text to object")
# Convert the JSON to an Object
responseObj = json.loads(response.text)
print(responseObj)

# Print the censored-content property/value of the responseObj
print("\n\nJust the censored lyrics")
print(responseObj["censored-content"])
