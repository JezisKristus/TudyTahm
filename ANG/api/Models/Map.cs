using System.ComponentModel.DataAnnotations;


namespace TT_API.Models
{
    public class Map
    {

        [Key]
        public int MapID { get; set; }
        public int IdUser { get; set; }
        public string MapName { get; set; }
        public string MapIcon { get; set; }
    }
}
