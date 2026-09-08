import { NextRequest } from 'next/server';
import { getVisaDefinition, getVisaSnapshot } from '@/lib/immigration';

const LOGO_BASE64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgFBgcGBQgHBgcJCAgJDBMMDAsLDBgREg4THBgdHRsYGxofIywlHyEqIRobJjQnKi4vMTIxHiU2OjYwOiwwMTD/2wBDAQgJCQwKDBcMDBcwIBsgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDD/wAARCAC0ALQDASIAAhEBAxEB/8QAHAAAAgMAAwEAAAAAAAAAAAAAAAYEBQcBAwgC/8QARRAAAQMDAQQHBAYIBAYDAAAAAQIDBAAFEQYSITFBBxMiUWFxgRQykaEVI0JSYrEIJDNygpLB0RZDY6I0RHOjssIXg+H/xAAaAQACAwEBAAAAAAAAAAAAAAAABAIDBQEG/8QAMREAAgIBAwIEBAUEAwAAAAAAAQIAAxEEEiETMQUiQWFRcZHwIzKBoeEUM7HBNFLR/9oADAMBAAIRAxEAPwDd6KKKIQoooohCiiuuTIZisqekuoZaR7y1qwBQTiE7KKU5usVyStvT8T2gI9+U/wBhlHjv/rilR/URuspUVqXcNSSwd8W1p2GEfvOcMUi+tQHbWNx9petDYy3E0iZe7ZCOJM5lCh9kK2j8BUIaoiu/8HEmyh3oZIHxNLdu01qaThRRatPtH7LTftcj1Ursg+VfM6FpyG4Wr1qO63aSncpluSo4Pdst4CfU1Avqm5wFHvO4pXucxlOoJPK0uo/6ryEV9t3uQs74KPSSg0jGVo5k/VaVU4R9qU5vPxUqpsWRpZ/ARpmECTgBLqQfmBQK9UeeoPp/Eh1aO2Pv6x4auDixlcJ5I704V+Vd6JbStytpB/GnFKiI2mm/2kGXbD95K1pSD5oURVoxbXVsh2z36QpvkHCmQjy34PzqQ/qV54P3+k7mpu3H3+svUqSoZSQR4GuaoFv3eFvmW5uagcXYKtlfnsK4+makWu+w7gstxJQW6k4Uw8OrdSe4g1MarBxYMff32zOGrjIlvRXwh1KzjelX3TuNfdNKwYZErII7woooqU5CiiiiEKKKKIQoooohCiilHWurl219FosqPaLu/uAAyGQeZ8cb8cAN5qFli1rubtJKpc4En6o1XDsIDCUmVPc/Zxkcd/Aq7h8zWf326vuTGfp3rrldHj+q2eLy7toD3R8/E1EbVKbvBs2ntm5alfyqXPcO01DB9457/Hv3eFaPo3R8HTDC3EKVLuMjfJnPb3HTzA+6nw+OazAtutOW4T/MbJSgYHLRfteg596S2/rSQExknLdnhK2GG/BxQ3rPlu8abpciz6Tsi3nBHt1vjj3W0BIzyASOJPxNWTzrbDK3nlpbbbSVrWo4CUgZJPhivMfSHraVrfUBTE2xbmFFENjhn/UUPvH5Dd31p00qg2oMCJW2k8mMupuk246lmmDbeshwVnZDTf7Rwd7ih/4jd35qAtaY7KUKyEp+yNw86k6S082xEQoDbdUMuLx8BUbUAAXsAADPAVga7Ub7dingS3oFa97d5zBkh6SEdU1sHiRxG/Oav1CLMQshOHkkkqQOeOdKcDqwol0lpKQSSOWK65d0bkSAI4ICTjbKjkjy5U34dVdqLcqSAPWZ2odKk59Y4RrxKdYSyp1SkJ4Z4jwzVjbrlKhPB1lxSFcyk4z/AH9aXLMOtxv40xJjKSgGvWtWg4xM1LHPmzH+w35u4thD+yl3OARuCj5cj4VIvNigXhA9sZy6n3HkHZcR5KG/04VnUSQuJISse6ThY7xzrRrRN65AZcVtLCdpC/vp7/Osq+oKdrcgzY09xcZ9RKJ9y8abGZhXeLSni6B+sMDvOPeHj+VX9uuLE2KiTEeTJjr4LTxT4EVPIzSjeLJLs0pd30wntHtSYAHYfHMpHJXhz5YPHPelqjvq+n39/COhg/Dd43AgjIORRVTYbzEvEBMyArKODrR95s1apUFAEcDTFNwsHvK2QqZzRRRV8hCiiiiEKKKj3KdHtlvkTprgbjx0FxxXcB/WiEoOkDVSdNWsCPhy4ycojt4zjvWR3Du5nA76y51yfb30Wm2bUrVl4P1zpVkxkq3kbXJWMlSuQHgK6JWoXZsqdrC5JSVJX1FujrPZDgG7+FA3k95p46GdLuRLe5qO67Tlyug2kKc95DJOR5Fe5R8NkVlEHV24P5R+8e4oT3MZtDaTh6Ss6YkfDslzC5MkjtPL7/BI34HLzJNMNFBOBmtQDAwIkTnkzLP0htTKtWlkWiMvZfui9heDvDSd6vidkfGsIsjzcdbjjhwoI7PntDPyzTf+kJcFS9eBjayiLGQkDxUSo/mKQGFU1WgK4MTtYhszfbFMjM2Z+QtxIaAK8n7uM5pCuOobe8+HUtuL2jv4DFUduvbgtz9vkPrSy63sJITnHnzrkRVxIrEyH9evKlKdT2kpHAdkj5mshPDKlsPX5JPHoPrLrtY9ijZ+sk3e4pccDcXKUYB2xuKgfyFRI7myQa6zJLxCpKusVjdkYPxFfatgLIQhTe/go5/pXo9HSmnQVqMTDvY2HcTG/TlwCSlK6fmXm3Y/ZxwrIYD5bUKbrTcnQkBC8+B5UxbXu5Erpt2+UxhfICvWndpgWuNHDaisx94UdxUOY+BIrNFXdlt5tTpC9lQKkjnv4U/3K4tKaOyrNec8YuNISbXhwVyxjclQWkKScpUMg+FckZqv07I9pssVzj2Sn4Ej+lWFWI25Q3xjh4iVqiDI07cVams6fq+Nwjj3Vp5uY/8AL+bkcsttnsTYjU2GrajPjPik8wfEVPWkLSUqAIIwQRkGkC1r/wAHasVZXsi0XLtxCTubVkDZ9CQnyKO40jehqbqJ9/frL1O8YPcTQKKjx1lKy0viPdqRTldgsXcJSwwcQoooqyRhWV9N97eeXB0vbjtPylJcdSOeVYbSfXKj5CtTUpKUlSyEpAySeQrzom8Lu2qr9qlQ2hESpUYH76z1bI9E76U1dnTrOO5jGnTc8lW6yt6k1vb9OsErtVsBQ4RwWhsgvL81rIT5E16BSAlICQABuAHAVmvQdZRGg3K6udpb73sjSzzQ1uUf4nCs+grS6lpa+nWBI3vueFfLpw2o+FfVfLoy2oeFMymeUumsKHSHOUr7bbSh5bAH9KUWiM7zgVo36QdtUxqOJOCexIZLRP4kH+yh8KzJCsU3UeIpYOZYoWnlk1LhyCw+lxO/HEZxkd1ViFVJZWOe8UzwRgxNhjtG63RorNu9rLeOtJ2C5hRAHd65319CXHcThz61Pcvf86+LrIEyFHkRBiOUAbAxlBG4g4qtYytYTXjrrLWsZ2JBz8e00giqoUCWyYsZ1KjHJSvkknI9K+GJC0HZUSgg8DurugRlKWEg43UzRbeksfrDaFtnhtDgKa0/jr6fy3eYfvE7fDxbynEW3H8oO/lxpgtupiq0/rLyS6ydk594jkfHdSfdCiNOeZaXtpQrAINQGnfrsneBvNeg1mmr19Az8xENNY+msOPlPS/Rw97TpCI/vw4txSc922aZKpdEQFWzSVriODDiI6Ssdyldo/M1dUgqhAFHpN8EkZMKWekazG7abeUygrlQ/wBZYCeJKQdpI/eTtDzx3UzVweFDKGBBklJU5EWNL3n6Z07HnpcC32fq3VD7SgAQr+JJCv4qZWXEutJcTwUM1nGj0ix61u+nVdmO+VFgHux1jf8AsWtP/wBVO1jfyHY6vebOQPz+dZmnc1XdM+v+RGbFDLuEtKKKK1YrFrpMuZtGhLvKQrZcLBZQfxLIQPzNYRZsQtHx3lDdJluzF+Lcds7I/nrUf0hZfUaMjRwd8magHySlSvzxWfLhldnstuxjbt8doj8UmSjP+0mszWHc6p7x3T8KWm36Ctv0ToyzwlDDjcVBc8VqG0o/zKNXtAATuG4DcPKitIRIwooorsJm/TLpdV904+mOjakskPs45qAOR6gkeeK8wnKSQdxr27PjJkMKSRxrzx0w9H7kSW/ebUzlpWVyWkD3TzWB3Hn3ce+rK22nBlTrnmZahVd7a99RQCDvrsTupwNFWWX1kuDcN4iQ2p2O4BtoScHzGedOqtMMLsqrtDeWqMpvrGyE8Rnn3VmjbhTv5CtYuEx20aCtloJ/WHGkhwfdHvEfEgelYfi9aja6/mJjmjbhg3YSptrhQpODvAxvqbc9SIhRHEB1su7PYQd5z347qVLjc1w2OqSCHXQd4PujvqiSpRO8kk99K6LwoXkXW9v8yu7UFRtXvJrslS1KUpRUpRySeZpm6L9Pr1JquMy4gqisEPyTy2Encn+I4HxpZtdtmXa4NQYDKn5LpwlCfmSeQHfXpjo40gxpSypYSQ5Jd7ch7GOsV4fhHAfHnXpbrgBtWJUUbjuMbRwooopCakKKKKITNekgG06zsl6RuSpIS4e/qlgn/tuu/CmhDoi6oSjOEvbv5h/cVU9L8T2iyQHAN7c1LWfB1tbR+ahUOVcVOw7Bc/tPRWnVefZJ/OsXWHp3K/yMdpG5cfOaJRRx4cKK2olMf/SVcItVlRyLzyvghP8Aeq1hna1LZmcDZTJtDXoErV/61P8A0mQfouyK/wBV8f7E/wBqhtOY1RbXx7vtdpc9CFp/9qytT/yE+/hHav7Rm3DeK5oG4YorViUKKKKIQqDcbc3LbIIBNTqDuGTwohMI170Sh15cyxpQw6slSmDubWfw/dPy8qyW62efaHi1cYjsZXLrE4B8jwPoa9mustujtpBGKqJNntc0KaKmHM8UbSVA+lSFhWQasNPHyNygSMj86ZL5qJVweL7G0lasY2v8sdw8fGtn19obTNn09MuyrHEdcZ2dyQW87Sgn7JHfXTZujnSTstpLlubcQ6lSsrUsBOAD97HOl77qWtRbRz6Tq6ezYSp4mApSt17K1Fbizz3lRp10p0bX6/OJV7OqBGO8vSEkEj8KOJ9cCt+s2j7BbO1a4UVr8TKE5+I3103+cti9wLPFUWUPsuyH1oOFlKCkBAPLJVknjgeNW3arp1l/QSNemDNg9586J0NbNKxerithUhY+teXguOHxPIeA3U1DA3D4UjOPXR6Q5Fs9n2kBYb9sL7bYbVgHOCdpWMjhxr4tEu8dSiBIssxu6BWy5JcCeqKs/teszvHPA38sVnJrXZQ3TPMdOnC8bhHyil+Xdn06rftwcKWW4Tb4CcAlSlqBycdwG6ra3SOvjArWFL2lJ4jJwogU0moRrDUO4lRrIUMZKooopiVxX6TE50otR+xLiLHpIb/vSW66UaKsAJ3pZcR/Kcf0p16S1AaVWnm5LiIHrIb/ALVntwd2dI6fTzWy4vHmc/1rE8S/MBH9LNmjq2mGld6En5CiuIo2YrIPJtI+QoraHaIHvMw/SPiF7SMCSP8AImhJ8loUPzApKZndZaGJqD249uiSTjvZdbUfltfCtb6XbYbr0eXdpCdpxlsSUebZCj8gaxPQGxPbiw3Vdh5t+3r8AoHB+Duf4azNcNpWz4GPac5UrPTIUFDaSchW8Hwoqi0FPXcdH2t9/dIQwGHgeIcb7Cs+qava0wcjIiRGDiI3TC0+zYYl3jrWPoyUlx1IO5TS+wrI4HGQfjUPSuo02+03OS6sKDUZT6U4xladwHrtJHpT1d7ezdbXKt8kZZlNKZX5KGKwS1KcbYVb5+etjOlhzfjC21Y3943A/CsnXE02LqB8o/pgLUNRjDa7mluU1DeeCp2yFlR3qK/vZ79o5+FW+q70J1/bd2x7LChIUpJwU7bnbUcd4SlPxqovdkMPQdo1BgpeTLMh48wy/hCfgEtGo9ojpu93YtyE/wDHyAXt+ewN7nkNlOMeNZ7V2VDo5/Pj+Y0Cj/if9cyzXdpxhm3nbIiICnWQcdY8sdYQfBIWlIHDIJ7q6i5fYbDcsTrbNBKduC3HcSpIJAOysjBIz3DgcV0asSbXra6w5y1xmbmv2qM+NwOUBKgD3pUOHlVtH0vZFww99N6gKtnOwhaF5PgQjHxxXbKybnV8cdsk9vacVgEVhnn4f7nOtbmqT0eXeK4c7KGlo35IAeQCPmD61I2LjLMWJaURVyHcq2pOdhASkEncCTyGBVTqOz2+Loa/uRJlwkSW22UrblvIX1aVOpIxsADJ2ee/dV9pmU0zdI7rpI2G1ggDJwQN+OJrligtStzZHPPt85xThXKCR7ddLnBvTtovjLUee20H2Xox7DrecZSSAdx3FJqG1MuMbWLrTy47kS6JdmoKc7bakbLakHPLIyPCrLVsiPIvzV1Uerjwoq2dtY2doqUFE4PIBI8yTVRLbfZ1LYFSUKacft8p4oVxSFuhQB7jjHrXLFX8Va+UAz+s4mfKW7mMVujXy4zwpj2FuA1JQlTilK64hOyo4AGOeBvql0nOcXpgLXguBT+VEdokOK5066PIMWSRnBk5/wBiKz3SqSjTChkjK5HD/qKqV1a16apl9SMyKMWscH0l1ZXJ1qvE6w3H2d3qEmY1IbJJUl1xZAVkcR61bWyNfJ0tt4mA1bkyNoKSpfXFKFcCMYySO/gaqr2vZ6R5qAd67bHx3ntrzTNYZzUeC1HfC0rLihnG7tLON/qKurWoa1lfgenPrK3LdEMsvKKKK9BM6JXSzKDNqtjWd7k9LpH4Wm1un5pFI97SQdP2ob1NMNtEDvOwn8waYukt8T9V2+3A5RGj5c8FPLAPwaadPrVDYkqvXSXABHZZUHl+GyC4fmoCsPV/i6pUHpNGjyVFptOMbhy3UUUVuTOnw80h5pbTqQptxJQpJ5gjBHwry9CjuaT1ncbS+CTDf6xv8QQSd37zSlHzAr1JWJ/pCWB2FcLfqyAnCgUsSCBwWne2o+BGUnyFL6msWIRL6H2tND0g43FuM2I2sKYnYuDBB3EqwHAP4sK/ipprDNJ6jc9kiGHlx+BiTERzdZwQprz2QpH7zY762u3To9ygMTYTgdjyEBxtY5pNL6Cwmvpv3WS1KbWyOxkili6dHumrrcnp8uC57RIVtOlqS42FnGMkJUBnHGmegcRT5UNwYuCR2iNJ1dp67QpdneguOQgtcFxtSgjIQdk4GcgbtxzVnpPSWm7Q4LlY47gW4goC3JDjmyDjIwonB3YNY2l5aLrdww0t136SkJQhHvLJcwAPHJp26PtXIaIQ6tRju7lA8Ukbs47xzHcO8CsdNWy3kWjy5wD8Jovpx081nnHaMN7venb7LmWS62/2tER/qXOswNleAcp35+0N4INDfRfp5lRDblzS3n9kJ7gT5d+PWkKe6GukK+qQQQq4A545yhv+9OWrNbvMT5ca2bQahrLTq207TjjnNKeOACQOGSc8MVYdQoLm4ZAOBxIdJsKKzjIyYzI0vZEWN+zNwG0wJAPWtgnKz3lWdoncN+c7qrD0c6bMfqvZpO0DlDxlulxv91W1kDw4Gl2JrO7Q58ePeIUyCqTnqlvOpdQsgZIIBODjfjcanK1bPOoJMNTuwy40h+LspThI9xaTkb8LHHuUK62spAPUQgj0x6SAotz5W7+8u7ZoWxwJDchTcma60rabVNkKeCDyISd2fHFS79pa03+QxIuTDqnmElDbjT62lBJOSMpIyMiqu66ocEm2sRFhBejKlSMAEpGQlKRnOMq2v5a5kamejWC5ydoLksIR7PtAdpazsJBxxwr5VaNTpw/QA9M+3xkOlaR1IwWe1RLNDEWAhaGgor7binFEnmVKJJ4CqZvQWnmny63GkIysudWmW6G8k5PZ2sYzy4VVp1jIaS4oKDux1Uf6wDZL7isJ4AbgErURz3Vw/f7q3MWyzAu08tpCluMFCRvH2U5G15DNVHWUsFAQnPYYkhRYCSTj9Ywag0pZ9QPtyLlFUqQ0nZQ+06ppxKeONpJG7wNdFt0XZ7fJakNe2uuNKC0dfMdcAI4HBOD612aUvL14RIUtiS20zspCpLBZXt79pOCBnG7fjnV7TqBLQLNv1HMoJZPLmFcLUlCSpaglKRkqPADma5pR6RrkfY2rDGUoP3MK65SOLUVP7RXmrIQPFXhVjuK1LN2EiqljgRFfmpnPzr9IyET3VONg8Us7OE/BhBPm9Vv0KQXJMq6XySntLV1KD+JR214/2ilTWc0htMGKgFTqupQhAzkBQ28eBWlKB4NHvrZdIWYWDTkO3nHWto2niObh3q+e70rJ0Sm2w3N8/wDyO3sEQIJb0UUVsxCFV+orPFv9kmWqcMsSmy2o80nkoeIOD6VYUUQnlaA1cNNahfscwFE+E+VMFO7aVuJSk9ywEqT+IDvrW+j7UrMB1tlxQTarm5llX2YslW9TZ7kL95Pccivvps0IrUFuF6tLZ+lYKO0lHvPtDfgfiTxHqO6kDQt7iT2H2LmlCmn07M1s7gMnc6O5JOMke4vCuBNZN4bTv1VHzmghFybTPRVA4ilPTN4fgOs2e9PF0K7MKcvd14H+WvucA/m4jxbK0arVtXchiLoUODPPVpSf8YTCOH02s/8AfTTV0p6Xdsc53U1nQfY3F7c9hA/Zqz+2Tjl97499NrfR1YG7yq5NqmpcXJMktCUerLm1tHs+YzjNNEpbHUOiQUKb6tSlpODlGO1u5ill0oIdX7ExltRgqV9JgsB1mTPTLbH1j7ja3CDkKOUjIHLcBU24tSYer7za3JBhyFTnJCHCkHaZcXtBQBIzuJHHiMU2I0Voi3W5vUbTs5q34bkoQiQspIUQUJDeNreVJATx34q9v1s01rBTMe5trRMClpjqUFR5A2Qkr2CcEgbSc8RSw8POwqxzyCP5lx1Y3AgekSn9MBoIWnVfXOHAShNqBV6kqAHmTXdqC2otumrNemp5uCY0xxiRI6oN/Vuq2CMAn3VoTz76YYvRlZ2Sevul2lMI3qaclgIxjgSkA4x4imadZLZOsLlkcjtptzjQZ6lo7ASnls44ciKsTR8MHAGRjiVtqeRgk4+MzOFbE3a5ogdY5i4K6t0hW9tpAUpWz3DJPquoFqfeetqIlwKva7dIVHfwdyltnAKvkrzrTdOaRtWnpRfhuynn1tlpJkyC4QnIJCQeHAZ8qiXPo+sdyu0mc45OZelHrH248otoWcY2ikd4FLHwxukF3ebPf2xjH0lv9Wu/OOJRMW+0f4Djx76p1td6ke0MqaIS6hQ3tqBO4bKEg7+/HOo0iJerTCU5GvkG6NtIKwxNjKZeWAOAIykqPDhvp3v+mLPqC3R4s5nLUfBjuMuFCmjjAKFDwwOYNUbXR/HaSA3qW7pZPBPXNb+8bWzTN2kZgFVQQBjnIP1EpS4ckk5MlaOvjk2Q3FdSULUwXVsk5LWMfDjjHDIpsqrsFgt9hZWiA2suOkF191ZW46Rw2lH8hgeFTZ0yPb4jsqY6llhobS1qOAKa01bU1BXOcSi1g75UT5uc9i2QXZckkNtjOEjKlHkkDmSdwrPLmp2CxNu93WGbjOG2sjeIjKOCU9+xn+JxQ7qZX7my+lu4z0LSnP6lFPvkkblEfeI3/hG81mt6kS9eajbstqWlbRUFPPp3oATzH+mjJx95RJ5jGZqbjqm6SdoxUmzzGSeieyOaj1K5qKYx1cGAoIitneNsDCEjv2BvJ5qOe+toqFY7VFslqj26AjZYjo2U54qPNR8Sd5qbWvVWK12xax97ZhRRRVsrhRRRRCFYz0r9Hsi3zl6r0mgoWklyXHbTnZ+84lPNJ37SfM99bNRUHQOMGSVipyJhei9WQ7hblQZzaVxAkdYwokmOBwUk8S2OSh2m+BymtQtV0egx0CS4qbbyBsSwdpbQPAOAe8O5YpK6ROipbkpV90Z+rTkK61cVtWwFK+80fsq/DwPhwKrpHXkq1SjEnYgyEKKXGXgW2Vq57v8AJX37tg8wnjWK9NulffV2+EfDJcMGaLfNH3S4XeVdbDdIzLalJnwQSopTN2UtrWrG4oLacY71E10x+jmRDvrb8eUhcRlLYZWp0pdaCWOrKMbB2kk5URtAdo5BO+uYt+il/btc0WeavtqiyU5jveJAO7P30HFW6NbsQVJb1NEdtG1uTKz1sRzydTw8lAU/p9ZXcMHgxWylki5C6Mpf0SIUpm0NBEaJHUhjbUiStp5K1PObSRhWyFJHE9o5OMAWn+BpKL8xcQ3b30tTpbyUOZBbadS2EFJ2T2kFB3cN/EU6xJTExhL8R5qQyreHGVhaT6iu7I76dlEzX/42lsWtiNBehsKECIzJSkqCZb7Tu2oryk5ChkbRBPDII3Vyvo4niNFaizm4qQypT7fWqWPaG1rcilKtlPZQpZyMDcAAMVpNFGIRAjaJusO7Wu4sLt7sqO3tSXn1KUHHSXFr2UlBKMrcOFpUDjilWBRM0Tc5f0r1ibV7RcFKe9uKnC8NrYJjncPquwUZBHZPug5y/wBGd+BvrsIhq0ddV6du1pbTa4ce6LLwjMLc6uKctAIR2R2SELUo4HaUMDiaj3no/fkNyIUSBZ3bY9cVSww6VNltottgttkIV1e0tBKinkd28khuvuprLYG9q8XKPFPJtS8uK8kDtH4Un3bXF4uLKlWOGmzQMdq53UbJx3oa/qrdVNl1dQy5xLERn7CNd/1JbNMQGVXJaUPLSEsxGBtuOqx7qE8SOWdwpGuVzm3CYxO1C1h0qKrfZGlBWyR9twncVDmT2Uc+6qMTYtvS5dWJCnnndzl9uQKlL7wwjirwCcJ71YqngR7zraY9b9PMPNxXCBMmyVdp0cutWNwT3NI3efGsq2+zVHYgwv7mOJUtQ3N3km73m4akuv0RZVe2zZWW3XmSdgJ+022Twb+84d6/AYFa5oTSMXSdq6lBD0x7CpEjGNs8kjuSOQ9a50To226RglqGnrZToHXyljtuHu8E9w/M0xVoabTLSPeLW2l+B2hRRRTcohRRRRCFFFFEIUUUUQhSvrXQdl1e0VTmixNSMImMgBwdwPJQ8D6YpoorhAIwZ0EjkTzze9Hat0U0pPs6L3ZUna7CVLSjx2R22j4pOPGo9i1cloFNtu7ltKty4lw+tjq8NsAj+ZI869HUtak0BprURU5cLY2mQr/mI/1TnqRx9QaSt0SPyO8ZTUkcNMqTIRHJnLsUq2rVvM/T0ooQrxKUbSD6gVZwNcTkgCDrZt0D/Ku9uSpQ81tHPyrsndCMmE8p/S+o3YyuIS8Cg/ztn+lVUvRvSTGyl+Jbb2gc3UsvE+qglVL9HUV/kb7/AHlu+l+4jYxrjUhG5zSksd6JbzJPooGu1WuNR43QtNJPebqoj5JrOHLHqttX6x0eR1nmWo7if/BzFcC0akVjZ6O8HxRIP5ro36scf6/mGyiPsrWuoyk9ZdtMQB/pNvyFD44FUUvUj9xWWJWp73dlHcY9rZTFQfDKApWKrYmnNcPHETRduifidjoyPVxZq6j9HWv7mgIud+jW1g7i1HVjd+62Ej51DZrH4Jx+07mhe0q+sRZ1F1qJbNOE7+vmKL8xXiBlS8/y1Wi7m6TwzZIE3UVyzlL81G2lB+8lkdkeazWh2PoV0/CcD11kyrq7xIWrqkE+ITvPqa0C2WyDaowjWyGxEZH2GUBIPnjj61ZX4fzusOZBtSOyiZbYOiifdZYuWuZ7jiz/AMq05lWPulY3JH4U/GtUt0CJbIbcS3x240doYS22nAH/AO+NSKK0UrWsYURVnLd4UUUVZIQoooohCiiiiEKKKKIQoooohCiiiiEKKKKIQoooohDFFFFEIUUUUQhRRRRCFFFFEIUUUUQhRRRRCFFFFEJ//9k=';

function pdfText(value: string) {
  return value.normalize('NFKD').replace(/[^\x20-\x7E]/g, '').replace(/[()\\]/g, (m) => `\\${m}`);
}

function wrap(text: string, width = 82) {
  const words = pdfText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > width && line) { lines.push(line); line = word; } else { line = next; }
  }
  if (line) lines.push(line);
  return lines;
}

type PdfBlock =
  | { type: 'heading'; text: string }
  | { type: 'body'; text: string }
  | { type: 'check'; text: string }
  | { type: 'facts'; text: string }
  | { type: 'meta'; text: string }
  | { type: 'notice'; text: string }
  | { type: 'space' };

function blockHeight(block: PdfBlock) {
  if (block.type === 'space') return 6;
  const width = block.type === 'check' ? 72 : block.type === 'notice' ? 78 : 82;
  const lines = wrap(block.text, width).length || 1;
  if (block.type === 'heading') return 22;
  if (block.type === 'facts') return lines * 12 + 14;
  if (block.type === 'meta') return lines * 10 + 2;
  if (block.type === 'notice') return lines * 11 + 18;
  return lines * 12 + (block.type === 'check' ? 5 : 3);
}

function buildPdf(visaName: string, blocks: PdfBlock[]) {
  const pageWidth = 612;
  const pageHeight = 792;
  const left = 46;
  const right = 46;
  const contentTop = 660;
  const contentBottom = 58;
  const available = contentTop - contentBottom;

  const pages: PdfBlock[][] = [];
  let current: PdfBlock[] = [];
  let used = 0;
  for (const block of blocks) {
    const h = blockHeight(block);
    if (current.length && used + h > available) {
      pages.push(current);
      current = [];
      used = 0;
    }
    current.push(block);
    used += h;
  }
  if (current.length) pages.push(current);

  const logoBytes = Buffer.from(LOGO_BASE64, 'base64');
  const logoHex = logoBytes.toString('hex').toUpperCase();

  const objects: string[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  const pageObjectNumbers: number[] = [];
  const contentObjectNumbers: number[] = [];
  for (let i = 0; i < pages.length; i += 1) {
    pageObjectNumbers.push(6 + i * 2);
    contentObjectNumbers.push(7 + i * 2);
  }
  objects.push(`<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(' ')}] /Count ${pages.length} >>`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  objects.push(`<< /Type /XObject /Subtype /Image /Width 180 /Height 180 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${logoHex.length + 2} >>\nstream\n${logoHex}>\nendstream`);

  pages.forEach((pageBlocks, index) => {
    const contentNo = contentObjectNumbers[index];
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Logo 5 0 R >> >> /Contents ${contentNo} 0 R >>`);

    const c: string[] = [];
    c.push('1 1 1 rg 0 0 612 792 re f');
    c.push('q 58 0 0 58 46 700 cm /Logo Do Q');
    c.push('0.08 0.10 0.13 rg');
    c.push('BT /F2 10 Tf 1 0 0 1 118 752 Tm (WEBFIT NEWS) Tj ET');
    c.push(`BT /F2 17 Tf 1 0 0 1 118 726 Tm (${pdfText(visaName)}) Tj ET`);
    c.push('0.35 0.38 0.43 rg');
    c.push('BT /F1 9.5 Tf 1 0 0 1 118 707 Tm (New Zealand Visa Information Checklist) Tj ET');
    c.push('0.72 0.52 0.16 rg 46 688 520 2 re f');

    let y = contentTop;
    for (const block of pageBlocks) {
      if (block.type === 'space') { y -= 6; continue; }

      if (block.type === 'heading') {
        c.push('0.95 0.96 0.97 rg');
        c.push(`${left} ${y - 14} ${pageWidth - left - right} 20 re f`);
        c.push('0.08 0.10 0.13 rg');
        c.push(`BT /F2 10.5 Tf 1 0 0 1 ${left + 8} ${y - 1} Tm (${pdfText(block.text)}) Tj ET`);
        y -= 24;
        continue;
      }

      if (block.type === 'facts') {
        const lines = wrap(block.text, 82);
        c.push('0.98 0.97 0.93 rg');
        c.push(`${left} ${y - (lines.length * 12 + 8)} ${pageWidth - left - right} ${lines.length * 12 + 14} re f`);
        c.push('0.20 0.16 0.08 rg');
        c.push('BT /F2 9.5 Tf');
        lines.forEach((line) => { c.push(`1 0 0 1 ${left + 9} ${y - 1} Tm (${pdfText(line)}) Tj`); y -= 12; });
        c.push('ET');
        y -= 8;
        continue;
      }

      if (block.type === 'notice') {
        const lines = wrap(block.text, 78);
        const boxHeight = lines.length * 11 + 14;
        c.push('0.96 0.97 0.98 rg');
        c.push(`${left} ${y - boxHeight + 4} ${pageWidth - left - right} ${boxHeight} re f`);
        c.push('0.29 0.32 0.36 rg');
        c.push('BT /F1 8.8 Tf');
        lines.forEach((line) => { c.push(`1 0 0 1 ${left + 9} ${y - 7} Tm (${pdfText(line)}) Tj`); y -= 11; });
        c.push('ET');
        y -= 8;
        continue;
      }

      const width = block.type === 'check' ? 72 : 82;
      const lines = wrap(block.text, width);
      const font = block.type === 'meta' ? '/F1 8.2 Tf' : '/F1 9.5 Tf';
      const leading = block.type === 'meta' ? 10 : 12;
      c.push(block.type === 'meta' ? '0.38 0.41 0.45 rg' : '0.10 0.12 0.15 rg');

      if (block.type === 'check') {
        c.push('0.45 0.48 0.52 RG 0.8 w');
        c.push(`${left} ${y - 7} 8 8 re S`);
      }

      c.push(`BT ${font}`);
      lines.forEach((line, lineIndex) => {
        const x = block.type === 'check' ? left + 17 : left;
        c.push(`1 0 0 1 ${x} ${y} Tm (${pdfText(line)}) Tj`);
        y -= leading;
      });
      c.push('ET');
      y -= block.type === 'check' ? 5 : 3;
    }

    c.push('0.82 0.83 0.85 RG 46 42 m 566 42 l S');
    c.push('0.38 0.41 0.45 rg');
    c.push(`BT /F1 8 Tf 1 0 0 1 46 27 Tm (webfitnews.com  |  Source: Immigration New Zealand  |  Page ${index + 1} of ${pages.length}) Tj ET`);

    const stream = c.join('\n');
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, index) => {
    offsets[index + 1] = Buffer.byteLength(pdf, 'utf8');
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const visa = getVisaDefinition(slug);
  if (!visa) return new Response('Not found', { status: 404 });

  const snapshot = await getVisaSnapshot(slug);
  const checked = snapshot?.checkedAt
    ? new Date(snapshot.checkedAt).toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })
    : 'Unavailable';

  const facts = [
    snapshot?.lengthOfStay ? `Length of stay: ${snapshot.lengthOfStay}` : '',
    snapshot?.cost ? `Cost: ${snapshot.cost}` : '',
    snapshot?.processingTime ? `Processing time: ${snapshot.processingTime}` : '',
  ].filter(Boolean).join('   |   ');

  const blocks: PdfBlock[] = [
    { type: 'heading', text: 'Visa summary' },
    { type: 'body', text: visa.summary },
    ...(facts ? [{ type: 'facts', text: facts } as PdfBlock] : []),
    { type: 'space' },
    { type: 'heading', text: 'General requirements' },
    ...(snapshot?.applyRequirements.length
      ? snapshot.applyRequirements.map((item) => ({ type: 'check', text: item } as PdfBlock))
      : [{ type: 'body', text: 'Check the official Immigration New Zealand page for current eligibility requirements.' } as PdfBlock]),
    { type: 'space' },
    { type: 'heading', text: 'Documents and evidence' },
    ...(snapshot?.documentGuidance.length
      ? snapshot.documentGuidance.map((item) => ({ type: 'check', text: item } as PdfBlock))
      : [{ type: 'body', text: 'Check the official Immigration New Zealand page for the documents and evidence required for your circumstances.' } as PdfBlock]),
    { type: 'space' },
    { type: 'heading', text: 'Official source and verification' },
    { type: 'meta', text: `Last checked: ${checked}` },
    { type: 'meta', text: `Official page: ${visa.officialUrl}` },
    { type: 'space' },
    { type: 'notice', text: 'General information only. This checklist is not immigration advice and does not assess your personal eligibility. Requirements can vary by applicant and can change. Always confirm the current official requirements with Immigration New Zealand before applying.' },
  ];

  const pdf = buildPdf(visa.name, blocks);
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${slug}-checklist.pdf"`,
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
